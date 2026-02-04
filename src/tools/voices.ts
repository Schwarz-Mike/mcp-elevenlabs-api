import { z } from 'zod';
import { getClient } from '../api/client.js';
import { API_ENDPOINTS } from '../config/constants.js';
import type { Voice, VoicesResponse } from '../types/index.js';

// Input schemas
export const listVoicesSchema = z.object({
  language: z.string().optional().describe('Filter voices by language (e.g., "german", "english")'),
  gender: z.enum(['male', 'female', 'neutral']).optional().describe('Filter by gender'),
  category: z.enum(['premade', 'cloned', 'generated', 'professional']).optional().describe('Filter by voice category'),
  use_case: z.string().optional().describe('Filter by use case (e.g., "narration", "meditation")'),
});

export const getVoiceSchema = z.object({
  voice_id: z.string().describe('The voice ID to get details for'),
});

export type ListVoicesInput = z.infer<typeof listVoicesSchema>;
export type GetVoiceInput = z.infer<typeof getVoiceSchema>;

// List all available voices with optional filtering
export async function listVoices(input: ListVoicesInput): Promise<{
  voices: Voice[];
  total: number;
  filtered: number;
}> {
  const client = getClient();
  const response = await client.get<VoicesResponse>(API_ENDPOINTS.VOICES);

  let voices = response.voices;

  // Apply filters
  if (input.language) {
    const lang = input.language.toLowerCase();
    voices = voices.filter(v =>
      v.labels.language?.toLowerCase().includes(lang) ||
      v.labels.accent?.toLowerCase().includes(lang)
    );
  }

  if (input.gender) {
    voices = voices.filter(v =>
      v.labels.gender?.toLowerCase() === input.gender?.toLowerCase()
    );
  }

  if (input.category) {
    voices = voices.filter(v => v.category === input.category);
  }

  if (input.use_case) {
    const useCase = input.use_case.toLowerCase();
    voices = voices.filter(v =>
      v.labels.use_case?.toLowerCase().includes(useCase) ||
      v.labels.description?.toLowerCase().includes(useCase)
    );
  }

  return {
    voices,
    total: response.voices.length,
    filtered: voices.length,
  };
}

// Get details for a specific voice
export async function getVoice(input: GetVoiceInput): Promise<Voice> {
  const client = getClient();
  return await client.get<Voice>(API_ENDPOINTS.VOICE(input.voice_id));
}

// Format voice for display
export function formatVoice(voice: Voice): string {
  const labels = Object.entries(voice.labels)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  return `${voice.name} (${voice.voice_id})
  Category: ${voice.category}
  Labels: ${labels || 'none'}
  Preview: ${voice.preview_url}`;
}

// Format voices list for display
export function formatVoicesList(voices: Voice[]): string {
  if (voices.length === 0) {
    return 'No voices found matching the criteria.';
  }

  return voices.map(v => {
    const gender = v.labels.gender || 'unknown';
    const accent = v.labels.accent || '';
    const useCase = v.labels.use_case || '';

    return `- ${v.name} (${v.voice_id}) [${gender}${accent ? ', ' + accent : ''}${useCase ? ', ' + useCase : ''}]`;
  }).join('\n');
}
