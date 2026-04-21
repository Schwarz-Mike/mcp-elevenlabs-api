import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getClient } from '../api/client.js';
import {
  API_ENDPOINTS,
  OUTPUT_FORMAT_VALUES,
  DEFAULT_OUTPUT_FORMAT,
  MUSIC_PRESETS,
} from '../config/constants.js';

// Music section schema for composition plan
const musicSectionSchema = z.object({
  start_ms: z.number().min(0).describe('Start time in milliseconds'),
  end_ms: z.number().min(0).describe('End time in milliseconds'),
  style: z.string().describe('Musical style/genre for this section'),
  instruments: z.array(z.string()).optional().describe('Instruments to use'),
  mood: z.string().optional().describe('Mood of this section'),
  energy_level: z.enum(['low', 'medium', 'high']).optional().describe('Energy level'),
});

// Composition plan schema
const compositionPlanSchema = z.object({
  sections: z.array(musicSectionSchema).optional()
    .describe('Detailed section-by-section composition'),
  global_settings: z.object({
    tempo_bpm: z.number().min(20).max(300).optional().describe('Tempo in BPM'),
    key: z.string().optional().describe('Musical key (e.g., "C minor", "E major")'),
    time_signature: z.string().optional().describe('Time signature (e.g., "4/4", "3/4")'),
  }).optional().describe('Global music settings'),
});

// Music generation input schema
export const musicSchema = z.object({
  prompt: z.string().min(1).max(1000)
    .describe('Natural language description of the music to generate'),
  duration_seconds: z.number().min(10).max(300).default(60).optional()
    .describe('Duration in seconds (10-300, i.e., 10s to 5min)'),
  instrumental: z.boolean().default(true).optional()
    .describe('Force instrumental (no vocals)'),
  preset: z.enum(Object.keys(MUSIC_PRESETS) as [string, ...string[]]).optional()
    .describe('Use a predefined music preset (overrides prompt, duration, instrumental)'),
  composition_plan: compositionPlanSchema.optional()
    .describe('Advanced: detailed composition structure'),
  output_format: z.enum(OUTPUT_FORMAT_VALUES).default(DEFAULT_OUTPUT_FORMAT).optional()
    .describe('Audio output format'),
  output_path: z.string().optional()
    .describe('Full path where to save the audio file'),
});

export type MusicInput = z.infer<typeof musicSchema>;

// Generate music from prompt
export async function generateMusic(input: MusicInput): Promise<{
  file_path: string;
  prompt: string;
  duration_seconds: number;
  instrumental: boolean;
  format: string;
}> {
  const client = getClient();

  // Get settings from preset or input
  let prompt: string;
  let durationSeconds: number;
  let instrumental: boolean;

  if (input.preset && MUSIC_PRESETS[input.preset]) {
    const preset = MUSIC_PRESETS[input.preset];
    prompt = preset.prompt;
    durationSeconds = preset.duration_seconds;
    instrumental = preset.instrumental;
  } else {
    prompt = input.prompt;
    durationSeconds = input.duration_seconds ?? 60;
    instrumental = input.instrumental ?? true;
  }

  // Build request body
  const requestBody: {
    prompt: string;
    duration_seconds: number;
    instrumental?: boolean;
    composition_plan?: z.infer<typeof compositionPlanSchema>;
  } = {
    prompt,
    duration_seconds: durationSeconds,
  };

  if (instrumental) {
    requestBody.instrumental = instrumental;
  }

  if (input.composition_plan) {
    requestBody.composition_plan = input.composition_plan;
  }

  // Determine output format
  const outputFormat = input.output_format || DEFAULT_OUTPUT_FORMAT;

  // Build endpoint with output format
  const endpoint = `${API_ENDPOINTS.MUSIC}?output_format=${outputFormat}`;

  // Generate audio
  const audioBuffer = await client.generateAudio(endpoint, requestBody);

  // Determine output path
  let outputPath = input.output_path;
  if (!outputPath) {
    const outputDir = process.env.OUTPUT_DIR || '.';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const extension = outputFormat.startsWith('mp3') ? 'mp3' : 'audio';
    outputPath = path.join(outputDir, `music_${timestamp}.${extension}`);
  }

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  // Write audio file
  await fs.writeFile(outputPath, Buffer.from(audioBuffer));

  return {
    file_path: outputPath,
    prompt,
    duration_seconds: durationSeconds,
    instrumental,
    format: outputFormat,
  };
}

// Streaming music generation
export const streamMusicSchema = musicSchema.extend({});

export type StreamMusicInput = z.infer<typeof streamMusicSchema>;

export async function streamMusic(input: StreamMusicInput): Promise<{
  file_path: string;
  prompt: string;
  duration_seconds: number;
  instrumental: boolean;
  format: string;
}> {
  const client = getClient();

  // Get settings from preset or input
  let prompt: string;
  let durationSeconds: number;
  let instrumental: boolean;

  if (input.preset && MUSIC_PRESETS[input.preset]) {
    const preset = MUSIC_PRESETS[input.preset];
    prompt = preset.prompt;
    durationSeconds = preset.duration_seconds;
    instrumental = preset.instrumental;
  } else {
    prompt = input.prompt;
    durationSeconds = input.duration_seconds ?? 60;
    instrumental = input.instrumental ?? true;
  }

  // Build request body
  const requestBody: {
    prompt: string;
    duration_seconds: number;
    instrumental?: boolean;
  } = {
    prompt,
    duration_seconds: durationSeconds,
  };

  if (instrumental) {
    requestBody.instrumental = instrumental;
  }

  // Determine output format
  const outputFormat = input.output_format || DEFAULT_OUTPUT_FORMAT;

  // Build streaming endpoint
  const endpoint = `${API_ENDPOINTS.MUSIC_STREAM}?output_format=${outputFormat}`;

  // Generate audio using streaming endpoint
  const audioBuffer = await client.generateAudio(endpoint, requestBody);

  // Determine output path
  let outputPath = input.output_path;
  if (!outputPath) {
    const outputDir = process.env.OUTPUT_DIR || '.';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const extension = outputFormat.startsWith('mp3') ? 'mp3' : 'audio';
    outputPath = path.join(outputDir, `music_stream_${timestamp}.${extension}`);
  }

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  // Write audio file
  await fs.writeFile(outputPath, Buffer.from(audioBuffer));

  return {
    file_path: outputPath,
    prompt,
    duration_seconds: durationSeconds,
    instrumental,
    format: outputFormat,
  };
}
