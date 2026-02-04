import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getClient } from '../api/client.js';
import {
  API_ENDPOINTS,
  TTS_MODEL_VALUES,
  DEFAULT_TTS_MODEL,
  OUTPUT_FORMAT_VALUES,
  DEFAULT_OUTPUT_FORMAT,
  DEFAULT_VOICE_SETTINGS,
  DEFAULT_VOICE_ID,
  THERAPEUTIC_PRESETS,
} from '../config/constants.js';
import type { TTSRequest, VoiceSettings } from '../types/index.js';

// Voice settings schema
const voiceSettingsSchema = z.object({
  stability: z.number().min(0).max(1).default(DEFAULT_VOICE_SETTINGS.stability)
    .describe('Voice stability (0-1). Lower = more expressive, Higher = more consistent'),
  similarity_boost: z.number().min(0).max(1).default(DEFAULT_VOICE_SETTINGS.similarity_boost)
    .describe('Voice clarity/similarity (0-1). Higher = clearer but may sound artificial'),
  style: z.number().min(0).max(1).default(DEFAULT_VOICE_SETTINGS.style).optional()
    .describe('Style exaggeration (0-1). Only for v2 models'),
  use_speaker_boost: z.boolean().default(DEFAULT_VOICE_SETTINGS.use_speaker_boost).optional()
    .describe('Boost speaker similarity'),
});

// TTS input schema
export const ttsSchema = z.object({
  text: z.string().min(1).max(5000).describe('Text to convert to speech'),
  voice_id: z.string().default(DEFAULT_VOICE_ID).optional()
    .describe('Voice ID. Use elevenlabs_list_voices to find available voices'),
  model_id: z.enum(TTS_MODEL_VALUES as [string, ...string[]]).default(DEFAULT_TTS_MODEL).optional()
    .describe('TTS model to use'),
  voice_settings: voiceSettingsSchema.optional()
    .describe('Voice settings for fine-tuning output'),
  preset: z.enum(Object.keys(THERAPEUTIC_PRESETS) as [string, ...string[]]).optional()
    .describe('Use a predefined therapeutic preset (overrides voice_settings and model_id)'),
  output_format: z.enum(OUTPUT_FORMAT_VALUES).default(DEFAULT_OUTPUT_FORMAT).optional()
    .describe('Audio output format'),
  output_path: z.string().optional()
    .describe('Full path where to save the audio file. If not provided, uses OUTPUT_DIR env or current directory'),
  seed: z.number().optional()
    .describe('Seed for reproducible generation'),
  previous_text: z.string().optional()
    .describe('Previous text for better flow (context)'),
  next_text: z.string().optional()
    .describe('Next text for better flow (context)'),
});

export type TTSInput = z.infer<typeof ttsSchema>;

// Generate speech from text
export async function generateTTS(input: TTSInput): Promise<{
  file_path: string;
  voice_id: string;
  model_id: string;
  character_count: number;
  format: string;
}> {
  const client = getClient();

  // Determine voice ID
  const voiceId = input.voice_id || DEFAULT_VOICE_ID;

  // Get settings from preset or input
  let voiceSettings: VoiceSettings;
  let modelId: string;

  if (input.preset && THERAPEUTIC_PRESETS[input.preset]) {
    const preset = THERAPEUTIC_PRESETS[input.preset];
    voiceSettings = preset.voice_settings;
    modelId = preset.model_id;
  } else {
    voiceSettings = input.voice_settings || DEFAULT_VOICE_SETTINGS;
    modelId = input.model_id || DEFAULT_TTS_MODEL;
  }

  // Build request body
  const requestBody: TTSRequest = {
    text: input.text,
    model_id: modelId,
    voice_settings: voiceSettings,
  };

  if (input.seed !== undefined) {
    requestBody.seed = input.seed;
  }
  if (input.previous_text) {
    requestBody.previous_text = input.previous_text;
  }
  if (input.next_text) {
    requestBody.next_text = input.next_text;
  }

  // Determine output format
  const outputFormat = input.output_format || DEFAULT_OUTPUT_FORMAT;

  // Build endpoint with output format
  const endpoint = `${API_ENDPOINTS.TTS(voiceId)}?output_format=${outputFormat}`;

  // Generate audio
  console.error('[TTS] Generating audio...');
  const audioBuffer = await client.generateAudio(endpoint, requestBody);
  console.error(`[TTS] Audio generated, size: ${audioBuffer.byteLength} bytes`);

  // Determine output path
  let outputPath = input.output_path;
  if (!outputPath) {
    const outputDir = process.env.OUTPUT_DIR || '.';
    console.error(`[TTS] OUTPUT_DIR from env: "${outputDir}"`);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const extension = outputFormat.startsWith('mp3') ? 'mp3' : outputFormat.startsWith('pcm') ? 'wav' : 'audio';
    outputPath = path.join(outputDir, `tts_${timestamp}.${extension}`);
  }
  console.error(`[TTS] Output path: "${outputPath}"`);

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  console.error(`[TTS] Creating directory: "${dir}"`);
  try {
    await fs.mkdir(dir, { recursive: true });
    console.error('[TTS] Directory created/verified');
  } catch (mkdirError) {
    console.error(`[TTS] Error creating directory: ${mkdirError}`);
    throw mkdirError;
  }

  // Write audio file
  try {
    await fs.writeFile(outputPath, Buffer.from(audioBuffer));
    console.error(`[TTS] File written successfully to: "${outputPath}"`);

    // Verify file exists
    const stats = await fs.stat(outputPath);
    console.error(`[TTS] File verified, size on disk: ${stats.size} bytes`);
  } catch (writeError) {
    console.error(`[TTS] Error writing file: ${writeError}`);
    throw writeError;
  }

  return {
    file_path: outputPath,
    voice_id: voiceId,
    model_id: modelId,
    character_count: input.text.length,
    format: outputFormat,
  };
}

// Streaming TTS schema
export const ttsStreamSchema = ttsSchema.extend({});

export type TTSStreamInput = z.infer<typeof ttsStreamSchema>;

// Generate speech with streaming (for lower latency)
export async function generateTTSStream(input: TTSStreamInput): Promise<{
  file_path: string;
  voice_id: string;
  model_id: string;
  character_count: number;
  format: string;
}> {
  const client = getClient();

  // Determine voice ID
  const voiceId = input.voice_id || DEFAULT_VOICE_ID;

  // Get settings from preset or input
  let voiceSettings: VoiceSettings;
  let modelId: string;

  if (input.preset && THERAPEUTIC_PRESETS[input.preset]) {
    const preset = THERAPEUTIC_PRESETS[input.preset];
    voiceSettings = preset.voice_settings;
    modelId = preset.model_id;
  } else {
    voiceSettings = input.voice_settings || DEFAULT_VOICE_SETTINGS;
    modelId = input.model_id || DEFAULT_TTS_MODEL;
  }

  // Build request body
  const requestBody: TTSRequest = {
    text: input.text,
    model_id: modelId,
    voice_settings: voiceSettings,
  };

  // Determine output format
  const outputFormat = input.output_format || DEFAULT_OUTPUT_FORMAT;

  // Build streaming endpoint
  const endpoint = `${API_ENDPOINTS.TTS_STREAM(voiceId)}?output_format=${outputFormat}`;

  // Generate audio using streaming endpoint
  const audioBuffer = await client.generateAudio(endpoint, requestBody);

  // Determine output path
  let outputPath = input.output_path;
  if (!outputPath) {
    const outputDir = process.env.OUTPUT_DIR || '.';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const extension = outputFormat.startsWith('mp3') ? 'mp3' : outputFormat.startsWith('pcm') ? 'wav' : 'audio';
    outputPath = path.join(outputDir, `tts_stream_${timestamp}.${extension}`);
  }

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  // Write audio file
  await fs.writeFile(outputPath, Buffer.from(audioBuffer));

  return {
    file_path: outputPath,
    voice_id: voiceId,
    model_id: modelId,
    character_count: input.text.length,
    format: outputFormat,
  };
}
