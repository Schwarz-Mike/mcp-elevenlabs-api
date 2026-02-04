import type { TherapeuticPreset, MusicPreset } from '../types/index.js';

// API Base URL
export const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// API Endpoints
export const API_ENDPOINTS = {
  // TTS
  TTS: (voiceId: string) => `/text-to-speech/${voiceId}`,
  TTS_STREAM: (voiceId: string) => `/text-to-speech/${voiceId}/stream`,

  // Dialogue (V3)
  DIALOGUE: '/text-to-dialogue',

  // Music
  MUSIC: '/music',
  MUSIC_STREAM: '/music/stream',

  // Sound Effects
  SOUND_EFFECTS: '/sound-generation',

  // Voices
  VOICES: '/voices',
  VOICE: (voiceId: string) => `/voices/${voiceId}`,
} as const;

// Available TTS Models
export const TTS_MODELS = {
  ELEVEN_V3: 'eleven_v3',
  MULTILINGUAL_V2: 'eleven_multilingual_v2',
  TURBO_V2_5: 'eleven_turbo_v2_5',
  TURBO_V2: 'eleven_turbo_v2',
  FLASH_V2_5: 'eleven_flash_v2_5',
  FLASH_V2: 'eleven_flash_v2',
} as const;

export const TTS_MODEL_VALUES = Object.values(TTS_MODELS);

// Default Model
export const DEFAULT_TTS_MODEL = TTS_MODELS.MULTILINGUAL_V2;

// Output Formats
export const OUTPUT_FORMATS = [
  'mp3_22050_32',
  'mp3_44100_64',
  'mp3_44100_96',
  'mp3_44100_128',
  'mp3_44100_192',
  'pcm_16000',
  'pcm_22050',
  'pcm_24000',
  'pcm_44100',
  'ulaw_8000',
] as const;

// Mutable version for Zod schemas
export const OUTPUT_FORMAT_VALUES: [string, ...string[]] = [...OUTPUT_FORMATS] as [string, ...string[]];

export const DEFAULT_OUTPUT_FORMAT = 'mp3_44100_128';

// Default Voice Settings
export const DEFAULT_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
};

// Default Voice ID (Rachel - popular English voice)
export const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

// Audio Tags for V3 (emotional expression)
export const AUDIO_TAGS = [
  // Emotions
  'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised',
  'neutral', 'calm', 'excited', 'confident', 'worried',

  // Speaking Style
  'whispers', 'shouts', 'laughs', 'giggles', 'sighs',
  'cries', 'screams', 'yawns', 'sniffs',

  // Tone Modifiers
  'softly', 'loudly', 'quickly', 'slowly',
  'warmly', 'coldly', 'sarcastically', 'sincerely',

  // Special
  'breathing', 'pause', 'emphasis',
] as const;

// Therapeutic Voice Presets
export const THERAPEUTIC_PRESETS: Record<string, TherapeuticPreset> = {
  meditation_calm: {
    voice_settings: {
      stability: 0.7,
      similarity_boost: 0.8,
      style: 0.2,
      use_speaker_boost: true,
    },
    model_id: TTS_MODELS.MULTILINGUAL_V2,
  },

  meditation_warm: {
    voice_settings: {
      stability: 0.6,
      similarity_boost: 0.85,
      style: 0.4,
      use_speaker_boost: true,
    },
    model_id: TTS_MODELS.MULTILINGUAL_V2,
  },

  hypnosis_deep: {
    voice_settings: {
      stability: 0.8,
      similarity_boost: 0.75,
      style: 0.1,
      use_speaker_boost: true,
    },
    model_id: TTS_MODELS.MULTILINGUAL_V2,
  },

  energetic_motivation: {
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.9,
      style: 0.6,
      use_speaker_boost: true,
    },
    model_id: TTS_MODELS.TURBO_V2_5,
  },

  children_storytelling: {
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.5,
      use_speaker_boost: true,
    },
    model_id: TTS_MODELS.TURBO_V2_5,
  },
};

// Music Presets
export const MUSIC_PRESETS: Record<string, MusicPreset> = {
  meditation_ambient: {
    prompt: 'Peaceful ambient meditation music with soft synthesizer pads, gentle nature sounds, slow harmonic progression, 60 BPM, deeply calming atmosphere',
    instrumental: true,
    duration_seconds: 300, // 5 minutes
  },

  sleep_therapy: {
    prompt: 'Ultra-slow ambient sleep music, barely audible drones, delta wave inducing frequencies, ethereal textures, minimal movement, 40 BPM or slower',
    instrumental: true,
    duration_seconds: 300,
  },

  yoga_flow: {
    prompt: 'Flowing yoga music with indian instruments, tanpura drone, soft tabla rhythms, meditative sitar melodies, 80 BPM, peaceful and centered',
    instrumental: true,
    duration_seconds: 240, // 4 minutes
  },

  nature_sounds: {
    prompt: 'Natural soundscape with forest ambience, gentle stream water, soft bird calls, wind through leaves, no musical instruments, organic and peaceful',
    instrumental: true,
    duration_seconds: 300,
  },

  therapeutic_background: {
    prompt: 'Soft therapeutic background music, gentle piano with subtle strings, slow tempo 55 BPM, warm and supportive, emotionally safe atmosphere',
    instrumental: true,
    duration_seconds: 180, // 3 minutes
  },
};

// Sound Effect Examples
export const SOUND_EFFECT_EXAMPLES = {
  ocean_waves: {
    text: 'Soft ocean waves with gentle seagulls in distance',
    duration_seconds: 30,
    prompt_influence: 0.5,
  },

  forest_ambience: {
    text: 'Forest ambience with birds chirping and wind in leaves',
    duration_seconds: 60,
    prompt_influence: 0.5,
  },

  bell_chime: {
    text: 'Gentle bell chime with long reverb tail',
    duration_seconds: 5,
    prompt_influence: 0.5,
  },

  fireplace: {
    text: 'Warm crackling fireplace',
    duration_seconds: 30,
    prompt_influence: 0.5,
  },

  singing_bowl: {
    text: 'Tibetan singing bowl struck softly, deep resonance with subtle harmonics',
    duration_seconds: 15,
    prompt_influence: 0.8,
  },
};

// Error Messages
export const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad Request - Invalid parameters provided',
  401: 'Unauthorized - Invalid or missing API key',
  403: 'Forbidden - Insufficient permissions for this operation',
  429: 'Rate Limited - Too many requests, please try again later',
  500: 'Server Error - ElevenLabs service temporarily unavailable',
  502: 'Bad Gateway - ElevenLabs service temporarily unavailable',
  503: 'Service Unavailable - ElevenLabs service temporarily unavailable',
};
