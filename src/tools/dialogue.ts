import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getClient } from '../api/client.js';
import {
  API_ENDPOINTS,
  TTS_MODELS,
  OUTPUT_FORMAT_VALUES,
  DEFAULT_OUTPUT_FORMAT,
  DEFAULT_VOICE_SETTINGS,
  AUDIO_TAGS,
} from '../config/constants.js';
import type { VoiceSettings } from '../types/index.js';

// Voice settings schema
const voiceSettingsSchema = z.object({
  stability: z.number().min(0).max(1).default(DEFAULT_VOICE_SETTINGS.stability),
  similarity_boost: z.number().min(0).max(1).default(DEFAULT_VOICE_SETTINGS.similarity_boost),
  style: z.number().min(0).max(1).default(DEFAULT_VOICE_SETTINGS.style).optional(),
  use_speaker_boost: z.boolean().default(DEFAULT_VOICE_SETTINGS.use_speaker_boost).optional(),
});

// Dialogue input schema
export const dialogueSchema = z.object({
  text: z.string().min(1).max(10000)
    .describe(`Dialogue text with optional V3 audio tags like [whispers], [sighs], [calmly], [softly, warmly]. Available tags: ${AUDIO_TAGS.slice(0, 10).join(', ')}, etc.`),
  voice_ids: z.array(z.string()).min(1).max(10)
    .describe('Array of voice IDs for different speakers in the dialogue'),
  model_id: z.enum([TTS_MODELS.ELEVEN_V3, TTS_MODELS.MULTILINGUAL_V2]).default(TTS_MODELS.ELEVEN_V3).optional()
    .describe('Model to use (eleven_v3 recommended for audio tags)'),
  voice_settings: voiceSettingsSchema.optional()
    .describe('Voice settings applied to all voices'),
  output_format: z.enum(OUTPUT_FORMAT_VALUES).default(DEFAULT_OUTPUT_FORMAT).optional()
    .describe('Audio output format'),
  output_path: z.string().optional()
    .describe('Full path where to save the audio file'),
});

export type DialogueInput = z.infer<typeof dialogueSchema>;

// Validate audio tags in text
export function validateAudioTags(text: string): { valid: boolean; warnings: string[]; tags: string[] } {
  const tagPattern = /\[([^\]]+)\]/g;
  const warnings: string[] = [];
  const foundTags: string[] = [];

  let match;
  while ((match = tagPattern.exec(text)) !== null) {
    const tagContent = match[1];
    const tags = tagContent.split(',').map(t => t.trim().toLowerCase());

    for (const tag of tags) {
      foundTags.push(tag);
      if (!AUDIO_TAGS.includes(tag as any)) {
        warnings.push(`Unknown audio tag: [${tag}]. It may still work but is not officially documented.`);
      }
    }
  }

  return {
    valid: true,
    warnings,
    tags: foundTags,
  };
}

// Generate dialogue with multiple voices
export async function generateDialogue(input: DialogueInput): Promise<{
  file_path: string;
  voice_ids: string[];
  model_id: string;
  character_count: number;
  audio_tags_found: string[];
  warnings: string[];
  format: string;
}> {
  const client = getClient();

  // Validate audio tags
  const tagValidation = validateAudioTags(input.text);

  // Build request body
  const requestBody: {
    text: string;
    voice_ids: string[];
    model_id: string;
    voice_settings?: VoiceSettings;
  } = {
    text: input.text,
    voice_ids: input.voice_ids,
    model_id: input.model_id || TTS_MODELS.ELEVEN_V3,
  };

  if (input.voice_settings) {
    requestBody.voice_settings = input.voice_settings;
  }

  // Determine output format
  const outputFormat = input.output_format || DEFAULT_OUTPUT_FORMAT;

  // Build endpoint with output format
  const endpoint = `${API_ENDPOINTS.DIALOGUE}?output_format=${outputFormat}`;

  // Generate audio
  const audioBuffer = await client.generateAudio(endpoint, requestBody);

  // Determine output path
  let outputPath = input.output_path;
  if (!outputPath) {
    const outputDir = process.env.OUTPUT_DIR || '.';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const extension = outputFormat.startsWith('mp3') ? 'mp3' : 'audio';
    outputPath = path.join(outputDir, `dialogue_${timestamp}.${extension}`);
  }

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  // Write audio file
  await fs.writeFile(outputPath, Buffer.from(audioBuffer));

  return {
    file_path: outputPath,
    voice_ids: input.voice_ids,
    model_id: requestBody.model_id,
    character_count: input.text.length,
    audio_tags_found: tagValidation.tags,
    warnings: tagValidation.warnings,
    format: outputFormat,
  };
}

// Helper to format text with audio tags for meditation
export function formatMeditationText(sections: {
  emotion?: string;
  text: string;
}[]): string {
  return sections.map(section => {
    if (section.emotion) {
      return `[${section.emotion}] ${section.text}`;
    }
    return section.text;
  }).join('\n\n');
}

// Example meditation text with audio tags
export const MEDITATION_EXAMPLE = `
[softly, warmly] Welcome to this moment of peace and relaxation.

[whispers] Close your eyes and let go of all tension.

[calmly] Take a deep breath in... [pause] ...and slowly release.

[sighs] Feel the weight of your body sinking into comfort.

[softly] You are safe here. You are at peace.

[whispers] Let each breath carry you deeper into relaxation.
`.trim();
