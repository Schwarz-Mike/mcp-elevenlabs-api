// ElevenLabs API Types

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
  speed?: number;
}

export interface TTSRequest {
  text: string;
  model_id: string;
  voice_settings?: VoiceSettings;
  pronunciation_dictionary_locators?: Array<{
    pronunciation_dictionary_id: string;
    version_id: string;
  }>;
  seed?: number;
  previous_text?: string;
  next_text?: string;
  previous_request_ids?: string[];
  next_request_ids?: string[];
}

export interface DialogueRequest {
  text: string;
  voice_ids: string[];
  model_id: string;
  voice_settings?: VoiceSettings;
}

export interface MusicRequest {
  prompt?: string;
  composition_plan?: CompositionPlan;
  duration_seconds?: number;
  instrumental?: boolean;
  model_id?: string;
}

export interface CompositionPlan {
  sections: MusicSection[];
  global_settings?: {
    tempo_bpm?: number;
    key?: string;
    time_signature?: string;
  };
}

export interface MusicSection {
  start_ms: number;
  end_ms: number;
  style: string;
  instruments?: string[];
  vocals?: {
    type: 'male' | 'female' | 'mixed' | 'none';
    lyrics?: string;
  };
  mood?: string;
  energy_level?: 'low' | 'medium' | 'high';
}

export interface SoundEffectRequest {
  text: string;
  duration_seconds?: number;
  prompt_influence?: number;
}

export interface Voice {
  voice_id: string;
  name: string;
  category: 'premade' | 'cloned' | 'generated' | 'professional';
  labels: {
    accent?: string;
    description?: string;
    age?: string;
    gender?: string;
    use_case?: string;
    language?: string;
  };
  preview_url: string;
  available_for_tiers: string[];
  settings?: VoiceSettings;
  high_quality_base_model_ids: string[];
}

export interface VoicesResponse {
  voices: Voice[];
}

export interface ElevenLabsError {
  status: number;
  detail?: {
    status: string;
    message: string;
  };
}

// Therapeutic presets
export interface TherapeuticPreset {
  voice_settings: VoiceSettings;
  model_id: string;
}

export interface MusicPreset {
  prompt: string;
  instrumental: boolean;
  duration_seconds: number;
}
