#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Import tools
import {
  listVoicesSchema,
  getVoiceSchema,
  listVoices,
  getVoice,
  formatVoicesList,
  formatVoice,
} from './tools/voices.js';

import {
  ttsSchema,
  ttsStreamSchema,
  generateTTS,
  generateTTSStream,
} from './tools/tts.js';

import {
  dialogueSchema,
  generateDialogue,
  MEDITATION_EXAMPLE,
} from './tools/dialogue.js';

import {
  musicSchema,
  streamMusicSchema,
  generateMusic,
  streamMusic,
} from './tools/music.js';

import {
  soundEffectSchema,
  generateSoundEffect,
  THERAPEUTIC_SOUNDS,
} from './tools/sound-effects.js';

// Import constants for descriptions
import {
  TTS_MODEL_VALUES,
  THERAPEUTIC_PRESETS,
  MUSIC_PRESETS,
  AUDIO_TAGS,
  DEFAULT_VOICE_ID,
} from './config/constants.js';

// Create MCP server
const server = new McpServer({
  name: 'elevenlabs-mcp',
  version: '1.0.0',
});

// =============================================================================
// VOICE TOOLS
// =============================================================================

server.tool(
  'elevenlabs_list_voices',
  `List all available ElevenLabs voices with optional filtering.
Filters: language, gender (male/female/neutral), category (premade/cloned/generated/professional), use_case.
Returns voice IDs that can be used with TTS tools.`,
  listVoicesSchema.shape,
  async (args) => {
    try {
      const input = listVoicesSchema.parse(args);
      const result = await listVoices(input);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Found ${result.filtered} voices (${result.total} total):\n\n${formatVoicesList(result.voices)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error listing voices: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  'elevenlabs_get_voice',
  'Get detailed information about a specific voice by its ID.',
  getVoiceSchema.shape,
  async (args) => {
    try {
      const input = getVoiceSchema.parse(args);
      const voice = await getVoice(input);

      return {
        content: [
          {
            type: 'text' as const,
            text: formatVoice(voice),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error getting voice: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// =============================================================================
// TTS TOOLS
// =============================================================================

server.tool(
  'elevenlabs_tts',
  `Generate speech from text using ElevenLabs Text-to-Speech.
Models: ${TTS_MODEL_VALUES.join(', ')}
Presets: ${Object.keys(THERAPEUTIC_PRESETS).join(', ')}
Default voice: ${DEFAULT_VOICE_ID} (Rachel)
Use elevenlabs_list_voices to find voice IDs.`,
  ttsSchema.shape,
  async (args) => {
    try {
      const input = ttsSchema.parse(args);
      const result = await generateTTS(input);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Generated TTS audio:
- File: ${result.file_path}
- Voice: ${result.voice_id}
- Model: ${result.model_id}
- Characters: ${result.character_count}
- Format: ${result.format}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error generating TTS: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  'elevenlabs_tts_stream',
  `Generate speech with streaming (lower latency). Same parameters as elevenlabs_tts.
Use for real-time applications or when you need faster initial response.`,
  ttsStreamSchema.shape,
  async (args) => {
    try {
      const input = ttsStreamSchema.parse(args);
      const result = await generateTTSStream(input);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Generated streaming TTS audio:
- File: ${result.file_path}
- Voice: ${result.voice_id}
- Model: ${result.model_id}
- Characters: ${result.character_count}
- Format: ${result.format}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error generating streaming TTS: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// =============================================================================
// DIALOGUE TOOL (V3)
// =============================================================================

server.tool(
  'elevenlabs_dialogue',
  `Generate natural dialogue with multiple voices and emotional audio tags (V3).
Use audio tags in text like: [whispers], [sighs], [calmly], [softly, warmly]
Available tags: ${AUDIO_TAGS.slice(0, 15).join(', ')}, ...
Example meditation text format:
${MEDITATION_EXAMPLE.substring(0, 200)}...`,
  dialogueSchema.shape,
  async (args) => {
    try {
      const input = dialogueSchema.parse(args);
      const result = await generateDialogue(input);

      let response = `Generated dialogue audio:
- File: ${result.file_path}
- Voices: ${result.voice_ids.join(', ')}
- Model: ${result.model_id}
- Characters: ${result.character_count}
- Format: ${result.format}
- Audio tags found: ${result.audio_tags_found.length > 0 ? result.audio_tags_found.join(', ') : 'none'}`;

      if (result.warnings.length > 0) {
        response += `\n\nWarnings:\n${result.warnings.join('\n')}`;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: response,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error generating dialogue: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// =============================================================================
// MUSIC TOOLS
// =============================================================================

server.tool(
  'elevenlabs_music',
  `Generate music from a text prompt.
Duration: 10-300 seconds (10s to 5min)
Presets: ${Object.keys(MUSIC_PRESETS).join(', ')}
Use instrumental=true for background music without vocals.`,
  musicSchema.shape,
  async (args) => {
    try {
      const input = musicSchema.parse(args);
      const result = await generateMusic(input);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Generated music:
- File: ${result.file_path}
- Prompt: ${result.prompt.substring(0, 100)}${result.prompt.length > 100 ? '...' : ''}
- Duration: ${result.duration_seconds}s
- Instrumental: ${result.instrumental}
- Format: ${result.format}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error generating music: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  'elevenlabs_stream_music',
  'Generate music with streaming (better for longer compositions). Same parameters as elevenlabs_music.',
  streamMusicSchema.shape,
  async (args) => {
    try {
      const input = streamMusicSchema.parse(args);
      const result = await streamMusic(input);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Generated streaming music:
- File: ${result.file_path}
- Prompt: ${result.prompt.substring(0, 100)}${result.prompt.length > 100 ? '...' : ''}
- Duration: ${result.duration_seconds}s
- Instrumental: ${result.instrumental}
- Format: ${result.format}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error generating streaming music: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// =============================================================================
// SOUND EFFECTS TOOL
// =============================================================================

server.tool(
  'elevenlabs_sound_effect',
  `Generate cinematic sound effects from text description.
Duration: 0.5-22 seconds (auto if not specified)
prompt_influence: 0-1 (higher = more literal interpretation)

Therapeutic sound ideas:
${Object.entries(THERAPEUTIC_SOUNDS).slice(0, 5).map(([k, v]) => `- ${k}: "${v}"`).join('\n')}`,
  soundEffectSchema.shape,
  async (args) => {
    try {
      const input = soundEffectSchema.parse(args);
      const result = await generateSoundEffect(input);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Generated sound effect:
- File: ${result.file_path}
- Description: ${result.text}
- Duration: ${result.duration_seconds !== null ? `${result.duration_seconds}s` : 'auto'}
- Prompt influence: ${result.prompt_influence}
- Format: ${result.format}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error generating sound effect: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// =============================================================================
// START SERVER
// =============================================================================

async function main() {
  // Check for API key
  if (!process.env.ELEVENLABS_API_KEY) {
    console.error('Error: ELEVENLABS_API_KEY environment variable is required');
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('ElevenLabs MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
