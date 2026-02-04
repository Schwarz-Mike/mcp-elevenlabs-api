import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getClient } from '../api/client.js';
import {
  API_ENDPOINTS,
  OUTPUT_FORMAT_VALUES,
  DEFAULT_OUTPUT_FORMAT,
  SOUND_EFFECT_EXAMPLES,
} from '../config/constants.js';

// Sound effect input schema
export const soundEffectSchema = z.object({
  text: z.string().min(1).max(500)
    .describe('Natural language description of the sound effect to generate'),
  duration_seconds: z.number().min(0.5).max(22).optional()
    .describe('Duration in seconds (0.5-22). If not provided, auto-determines based on prompt'),
  prompt_influence: z.number().min(0).max(1).default(0.3).optional()
    .describe('How strongly the prompt influences generation (0-1). Higher = more literal interpretation'),
  output_format: z.enum(OUTPUT_FORMAT_VALUES).default(DEFAULT_OUTPUT_FORMAT).optional()
    .describe('Audio output format'),
  output_path: z.string().optional()
    .describe('Full path where to save the audio file'),
});

export type SoundEffectInput = z.infer<typeof soundEffectSchema>;

// Generate sound effect from description
export async function generateSoundEffect(input: SoundEffectInput): Promise<{
  file_path: string;
  text: string;
  duration_seconds: number | null;
  prompt_influence: number;
  format: string;
}> {
  const client = getClient();

  // Build request body
  const requestBody: {
    text: string;
    duration_seconds?: number;
    prompt_influence?: number;
  } = {
    text: input.text,
  };

  if (input.duration_seconds !== undefined) {
    requestBody.duration_seconds = input.duration_seconds;
  }

  if (input.prompt_influence !== undefined) {
    requestBody.prompt_influence = input.prompt_influence;
  }

  // Determine output format
  const outputFormat = input.output_format || DEFAULT_OUTPUT_FORMAT;

  // Build endpoint with output format
  const endpoint = `${API_ENDPOINTS.SOUND_EFFECTS}?output_format=${outputFormat}`;

  // Generate audio
  const audioBuffer = await client.generateAudio(endpoint, requestBody);

  // Determine output path
  let outputPath = input.output_path;
  if (!outputPath) {
    const outputDir = process.env.OUTPUT_DIR || '.';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    // Create a short description from the text for the filename
    const shortDesc = input.text.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const extension = outputFormat.startsWith('mp3') ? 'mp3' : 'audio';
    outputPath = path.join(outputDir, `sfx_${shortDesc}_${timestamp}.${extension}`);
  }

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  // Write audio file
  await fs.writeFile(outputPath, Buffer.from(audioBuffer));

  return {
    file_path: outputPath,
    text: input.text,
    duration_seconds: input.duration_seconds ?? null,
    prompt_influence: input.prompt_influence ?? 0.3,
    format: outputFormat,
  };
}

// Get example sound effects
export function getSoundEffectExamples(): Record<string, {
  text: string;
  duration_seconds: number;
  prompt_influence: number;
}> {
  return SOUND_EFFECT_EXAMPLES;
}

// Predefined meditation/therapeutic sound effects
export const THERAPEUTIC_SOUNDS = {
  // Nature sounds
  ocean_waves: 'Soft ocean waves gently rolling onto sandy beach with distant seagulls',
  rain_on_window: 'Gentle rain falling on a window with occasional distant thunder',
  forest_morning: 'Peaceful forest morning with birds chirping and gentle wind through leaves',
  stream_flowing: 'Clear mountain stream flowing over smooth rocks',
  wind_through_trees: 'Soft wind blowing through tall pine trees',

  // Ambient sounds
  fireplace_crackling: 'Warm crackling fireplace with occasional wood popping',
  wind_chimes: 'Gentle wind chimes tinkling in a light breeze',
  temple_bells: 'Distant temple bells echoing softly',

  // Meditation bells and bowls
  singing_bowl: 'Tibetan singing bowl struck gently with long resonance',
  meditation_bell: 'Single clear meditation bell with long decay',
  crystal_bowl: 'Crystal singing bowl with ethereal sustained tone',
  gong_soft: 'Soft gong being struck with gradual building resonance',

  // Transitions
  gentle_chime: 'Single gentle chime for meditation transitions',
  breath_cue: 'Soft subtle tone for breathing exercise cues',
  awakening_bell: 'Gentle bell to signal end of meditation',
};
