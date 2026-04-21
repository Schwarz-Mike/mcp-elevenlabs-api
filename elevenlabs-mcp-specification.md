# ElevenLabs MCP Server - Vollständige API Integration

## Projektübersicht

Erstelle einen umfassenden Model Context Protocol (MCP) Server für die vollständige Integration der ElevenLabs API. Der Server soll ALLE Audio-Generierungs-Features von ElevenLabs abdecken und eine nahtlose Integration mit FFmpeg für professionelle Audio-Produktion ermöglichen.

**Zielgruppe:** Therapeuten, Coaches und Content Creator für die Produktion von Meditationen, therapeutischen Audios und professionellen Voice-Overs.

---

## Technologie-Stack

- **Runtime:** Node.js / TypeScript
- **MCP Framework:** @modelcontextprotocol/sdk
- **HTTP Client:** axios oder native fetch
- **Audio Processing:** FFmpeg (externe Integration)
- **File System:** fs/promises für asynchrone Dateioperationen

---

## Offizielle Dokumentation (WICHTIG!)

**Claude Code MUSS diese Dokumentationen lesen und berücksichtigen:**

1. **Haupt-API-Dokumentation:**
   - https://elevenlabs.io/docs/api-reference/introduction
   - https://elevenlabs.io/docs/overview/intro

2. **Text-to-Speech (TTS):**
   - https://elevenlabs.io/docs/api-reference/text-to-speech
   - Streaming: https://elevenlabs.io/docs/api-reference/text-to-speech/stream

3. **Eleven Music API:**
   - https://elevenlabs.io/docs/overview/capabilities/music
   - https://elevenlabs.io/docs/developers/guides/cookbooks/music/quickstart
   - https://elevenlabs.io/docs/api-reference/music/stream

4. **Sound Effects:**
   - https://elevenlabs.io/docs/overview/capabilities/sound-effects
   - https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert

5. **Text to Dialogue (V3):**
   - https://elevenlabs.io/docs/api-reference/text-to-dialogue

6. **Modelle:**
   - https://elevenlabs.io/docs/overview/models
   - Eleven V3: https://elevenlabs.io/blog/eleven-v3

7. **Voice Management:**
   - https://elevenlabs.io/docs/overview/capabilities/voices
   - https://elevenlabs.io/docs/api-reference/voices

---

## API Authentifizierung

```typescript
// Umgebungsvariable
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Request Header
headers: {
  'xi-api-key': ELEVENLABS_API_KEY,
  'Content-Type': 'application/json'
}
```

---

## 1. Text-to-Speech (TTS) - Vollständige Implementation

### 1.1 Standard TTS Endpoint

**Tool Name:** `generate_tts`

**Base URL:** `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`

**Parameter (vollständig):**

```typescript
interface TTSRequest {
  // Required
  text: string;                    // Text to convert (max depends on model)
  
  // Voice & Model
  voice_id: string;                // Voice ID from library or custom
  model_id: string;                // Model selection
  
  // Voice Settings (alle optional)
  voice_settings?: {
    stability: number;             // 0.0-1.0 (default: 0.5)
    similarity_boost: number;      // 0.0-1.0 (default: 0.75)
    style?: number;                // 0.0-1.0 (nur v2, default: 0.0)
    use_speaker_boost?: boolean;   // true/false (default: true)
  };
  
  // Pronunciation
  pronunciation_dictionary_locators?: Array<{
    pronunciation_dictionary_id: string;
    version_id: string;
  }>;
  
  // Output Format
  output_format?: string;          // Siehe OUTPUT_FORMATS unten
  
  // Advanced (V3)
  seed?: number;                   // For reproducibility
  previous_text?: string;          // Context for better flow
  next_text?: string;              // Context for better flow
  previous_request_ids?: string[]; // Chain requests
  next_request_ids?: string[];     // Chain requests
}

// Verfügbare Output Formats
const OUTPUT_FORMATS = [
  'mp3_22050_32',     // Default - low quality
  'mp3_44100_64',     // Standard quality
  'mp3_44100_96',     // Good quality
  'mp3_44100_128',    // High quality (Creator+)
  'mp3_44100_192',    // Highest quality (Creator+)
  'pcm_16000',        // PCM for processing
  'pcm_22050',        // PCM standard
  'pcm_24000',        // PCM good
  'pcm_44100',        // PCM high (Pro+)
  'ulaw_8000'         // For Twilio
];

// Verfügbare Modelle
const TTS_MODELS = {
  v3: 'eleven_v3',                    // Newest, most expressive
  multilingual_v2: 'eleven_multilingual_v2',  // High quality, emotional
  turbo_v2_5: 'eleven_turbo_v2_5',   // Fast, good quality
  turbo_v2: 'eleven_turbo_v2',       // Legacy turbo
  flash_v2_5: 'eleven_flash_v2_5',   // Fastest, real-time
  flash_v2: 'eleven_flash_v2'        // Legacy flash
};
```

**Response Headers (wichtig für Tracking):**

```typescript
interface ResponseHeaders {
  'request-id': string;              // Unique request ID
  'history-item-id': string;         // For history tracking
  'character-cost': string;          // Character usage
  'content-type': 'audio/mpeg';
}
```

### 1.2 Streaming TTS

**Tool Name:** `generate_tts_stream`

**URL:** `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream`

**Vorteile:**
- Niedrigere Latenz
- Sofortige Ausgabe
- Ideal für Echtzeit-Anwendungen

**Implementation:** Stream-Response direkt in Datei schreiben

### 1.3 Text to Dialogue (V3 Feature)

**Tool Name:** `generate_dialogue`

**URL:** `https://api.elevenlabs.io/v1/text-to-dialogue`

**Parameter:**

```typescript
interface DialogueRequest {
  text: string;                      // Full dialogue text
  voice_ids: string[];               // Multiple voices for characters
  model_id: string;                  // Typically 'eleven_v3'
  
  // Advanced V3 Features
  audio_tags?: {                     // Emotional tags
    [position: number]: string[];    // e.g., { 0: ['whispers', 'sad'] }
  };
  
  voice_settings?: VoiceSettings;
  output_format?: string;
}
```

**Audio Tags für V3 (sehr wichtig!):**

```typescript
// Embedding in Text:
const exampleText = `
[whispers] Willkommen zu dieser Meditation.
[sighs] Lass alle Anspannung los.
[calmly] Atme tief ein und aus.
[softly, warmly] Du bist hier sicher.
`;

// Verfügbare Audio Tags:
const AUDIO_TAGS = [
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
  'breathing', 'pause', 'emphasis'
];
```

---

## 2. Music Generation API

### 2.1 Music Composition

**Tool Name:** `generate_music`

**URL:** `https://api.elevenlabs.io/v1/music/generate`

**Parameter:**

```typescript
interface MusicRequest {
  // Simple Prompt
  prompt?: string;                   // Natural language description
  
  // OR Advanced Composition Plan
  composition_plan?: CompositionPlan;
  
  // Settings
  music_length_ms?: number;          // 10000-300000 (10s-5min)
  instrumental?: boolean;            // Force instrumental
  model_id?: string;                 // 'eleven_music_v1'
  output_format?: string;            // Same as TTS
  
  // Enterprise only
  store_for_inpainting?: boolean;
}

interface CompositionPlan {
  sections: MusicSection[];
  global_settings?: {
    tempo_bpm?: number;
    key?: string;                    // e.g., 'C minor', 'E major'
    time_signature?: string;         // e.g., '4/4', '3/4'
  };
}

interface MusicSection {
  start_ms: number;
  end_ms: number;
  style: string;                     // Genre/style description
  instruments?: string[];
  vocals?: {
    type: 'male' | 'female' | 'mixed' | 'none';
    lyrics?: string;
  };
  mood?: string;
  energy_level?: 'low' | 'medium' | 'high';
}
```

**Prompt Examples:**

```typescript
const musicPrompts = {
  meditation: "Peaceful ambient meditation music with soft piano and nature sounds, 90 BPM, slowly building, 2 minutes",
  
  therapeutic: "Calming therapeutic background music, gentle strings and woodwinds, slow tempo 60 BPM, continuous flow, 5 minutes",
  
  energetic: "Uplifting motivational music, modern pop with guitar and drums, 120 BPM, positive vibes, 3 minutes",
  
  sleep: "Deep sleep meditation music, ultra-slow ambient drones, barely audible heartbeat rhythm, 8Hz binaural undertones, 5 minutes",
  
  custom: "lo-fi hip-hop beats, chill piano melody with vinyl crackle, slow intro 10s, then bass drop at 15s, loop-ready, 1 minute"
};
```

### 2.2 Generate Composition Plan

**Tool Name:** `generate_composition_plan`

**URL:** `https://api.elevenlabs.io/v1/music/generate-composition-plan`

**Zweck:** Erhalte detaillierten Plan VOR der Generierung für mehr Kontrolle

### 2.3 Music Streaming

**Tool Name:** `stream_music`

**URL:** `https://api.elevenlabs.io/v1/music/stream`

---

## 3. Sound Effects Generation

### 3.1 Sound Effects API

**Tool Name:** `generate_sound_effect`

**URL:** `https://api.elevenlabs.io/v1/sound-generation`

**Parameter:**

```typescript
interface SoundEffectRequest {
  text: string;                      // Description of sound effect
  
  // Duration
  duration_seconds?: number;         // 0.5-30 seconds, null = auto
  
  // Looping
  should_loop?: boolean;             // Create seamless loop
  
  // Control
  prompt_influence?: number;         // 0.0-1.0 (default: 0.3)
  
  // Output
  output_format?: string;
  model_id?: string;                 // 'eleven_text_to_sound_v2'
}
```

**Sound Effect Examples:**

```typescript
const soundEffects = {
  meditation: {
    text: "Soft ocean waves with gentle seagulls in distance",
    duration_seconds: 30,
    should_loop: true,
    prompt_influence: 0.5
  },
  
  nature: {
    text: "Forest ambience with birds chirping and wind in leaves",
    duration_seconds: 60,
    should_loop: true
  },
  
  transition: {
    text: "Gentle bell chime with long reverb tail",
    duration_seconds: 5,
    should_loop: false
  },
  
  background: {
    text: "Warm crackling fireplace",
    duration_seconds: 30,
    should_loop: true
  },
  
  complex: {
    text: "Tibetan singing bowl struck softly, deep resonance with subtle harmonics",
    duration_seconds: 15,
    should_loop: false,
    prompt_influence: 0.8
  }
};
```

---

## 4. Voice Management

### 4.1 List All Voices

**Tool Name:** `list_voices`

**URL:** `https://api.elevenlabs.io/v1/voices`

**Response:** Array von Voice Objects mit Metadaten

### 4.2 Get Voice Details

**Tool Name:** `get_voice`

**URL:** `https://api.elevenlabs.io/v1/voices/{voice_id}`

### 4.3 Voice Settings

```typescript
interface VoiceObject {
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
```

---

## 5. MCP Tools Implementation

### 5.1 Core TTS Tools

```typescript
// Tool 1: Standard Text-to-Speech
server.tool({
  name: "elevenlabs_tts",
  description: "Generate speech from text with full control over voice settings and models",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "Text to convert to speech" },
      voice_id: { type: "string", description: "Voice ID or name" },
      model_id: { 
        type: "string", 
        enum: Object.values(TTS_MODELS),
        default: "eleven_multilingual_v2"
      },
      voice_settings: {
        type: "object",
        properties: {
          stability: { type: "number", minimum: 0, maximum: 1, default: 0.5 },
          similarity_boost: { type: "number", minimum: 0, maximum: 1, default: 0.75 },
          style: { type: "number", minimum: 0, maximum: 1, default: 0 },
          use_speaker_boost: { type: "boolean", default: true }
        }
      },
      output_format: {
        type: "string",
        enum: OUTPUT_FORMATS,
        default: "mp3_44100_128"
      },
      output_path: { type: "string", description: "Where to save the audio file" }
    },
    required: ["text", "voice_id"]
  }
});

// Tool 2: Text to Dialogue (V3)
server.tool({
  name: "elevenlabs_dialogue",
  description: "Generate natural dialogue with multiple voices and emotional audio tags (V3)",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "Dialogue text with optional [audio tags]" },
      voice_ids: { 
        type: "array", 
        items: { type: "string" },
        description: "Array of voice IDs for different speakers"
      },
      model_id: { type: "string", default: "eleven_v3" },
      output_path: { type: "string" }
    },
    required: ["text", "voice_ids"]
  }
});
```

### 5.2 Music Tools

```typescript
// Tool 3: Generate Music
server.tool({
  name: "elevenlabs_music",
  description: "Generate music from text prompt with optional composition plan",
  inputSchema: {
    type: "object",
    properties: {
      prompt: { type: "string", description: "Music description" },
      music_length_ms: { 
        type: "number", 
        minimum: 10000, 
        maximum: 300000,
        description: "Duration in milliseconds (10s-5min)"
      },
      instrumental: { 
        type: "boolean", 
        default: false,
        description: "Force instrumental (no vocals)"
      },
      composition_plan: {
        type: "object",
        description: "Advanced: Detailed composition structure"
      },
      output_path: { type: "string" }
    },
    required: ["prompt"]
  }
});

// Tool 4: Generate Composition Plan
server.tool({
  name: "elevenlabs_composition_plan",
  description: "Generate detailed composition plan from prompt for fine-tuned control",
  inputSchema: {
    type: "object",
    properties: {
      prompt: { type: "string" },
      music_length_ms: { type: "number" }
    },
    required: ["prompt"]
  }
});
```

### 5.3 Sound Effects Tools

```typescript
// Tool 5: Generate Sound Effect
server.tool({
  name: "elevenlabs_sound_effect",
  description: "Generate cinematic sound effects with optional looping",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "Sound effect description" },
      duration_seconds: { 
        type: "number", 
        minimum: 0.5, 
        maximum: 30,
        description: "Duration in seconds, null for auto"
      },
      should_loop: { 
        type: "boolean", 
        default: false,
        description: "Create seamless looping sound"
      },
      prompt_influence: { 
        type: "number", 
        minimum: 0, 
        maximum: 1, 
        default: 0.3 
      },
      output_path: { type: "string" }
    },
    required: ["text"]
  }
});
```

### 5.4 Voice Management Tools

```typescript
// Tool 6: List Voices
server.tool({
  name: "elevenlabs_list_voices",
  description: "Get all available voices with metadata and filtering options",
  inputSchema: {
    type: "object",
    properties: {
      language: { type: "string", description: "Filter by language (e.g., 'german')" },
      gender: { type: "string", enum: ["male", "female", "neutral"] },
      category: { type: "string", enum: ["premade", "cloned", "generated", "professional"] }
    }
  }
});

// Tool 7: Get Voice Details
server.tool({
  name: "elevenlabs_get_voice",
  description: "Get detailed information about a specific voice",
  inputSchema: {
    type: "object",
    properties: {
      voice_id: { type: "string" }
    },
    required: ["voice_id"]
  }
});
```

### 5.5 Batch & Workflow Tools

```typescript
// Tool 8: Batch TTS Generation
server.tool({
  name: "elevenlabs_batch_tts",
  description: "Generate multiple TTS files in batch from array of texts",
  inputSchema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            voice_id: { type: "string" },
            output_filename: { type: "string" }
          }
        }
      },
      voice_settings: { type: "object" },
      model_id: { type: "string" },
      output_directory: { type: "string" }
    },
    required: ["items"]
  }
});

// Tool 9: Create Meditation Audio (High-Level Helper)
server.tool({
  name: "elevenlabs_create_meditation",
  description: "High-level tool to create complete meditation audio with intro, main, outro",
  inputSchema: {
    type: "object",
    properties: {
      intro_text: { type: "string" },
      main_text: { type: "string" },
      outro_text: { type: "string" },
      background_music_prompt: { type: "string" },
      voice_id: { type: "string" },
      total_duration_minutes: { type: "number" },
      output_path: { type: "string" }
    },
    required: ["main_text", "voice_id"]
  }
});
```

---

## 6. FFmpeg Integration Workflow

### 6.1 Audio Mixing Tools

```typescript
// Tool 10: Mix Voice with Music
server.tool({
  name: "ffmpeg_mix_audio",
  description: "Mix TTS voice with background music using FFmpeg",
  inputSchema: {
    type: "object",
    properties: {
      voice_file: { type: "string", description: "Path to voice audio" },
      music_file: { type: "string", description: "Path to background music" },
      music_volume: { 
        type: "number", 
        default: 0.3,
        description: "Background music volume (0-1)"
      },
      output_path: { type: "string" },
      fade_in_duration: { type: "number", default: 2, description: "Music fade in (seconds)" },
      fade_out_duration: { type: "number", default: 3, description: "Music fade out (seconds)" }
    },
    required: ["voice_file", "music_file", "output_path"]
  }
});

// FFmpeg Command Example:
const mixCommand = `
ffmpeg -i ${voiceFile} -i ${musicFile} \
  -filter_complex "\
    [1:a]volume=${musicVolume},\
    afade=t=in:st=0:d=${fadeIn},\
    afade=t=out:st=${duration-fadeOut}:d=${fadeOut}[music];\
    [0:a][music]amix=inputs=2:duration=first:dropout_transition=2\
  " \
  -c:a libmp3lame -b:a 192k ${outputPath}
`;
```

### 6.2 Audio Processing Tools

```typescript
// Tool 11: Audio Normalization
server.tool({
  name: "ffmpeg_normalize",
  description: "Normalize audio levels for consistent volume",
  inputSchema: {
    type: "object",
    properties: {
      input_file: { type: "string" },
      target_level: { type: "number", default: -16, description: "Target LUFS level" },
      output_file: { type: "string" }
    },
    required: ["input_file", "output_file"]
  }
});

// Tool 12: Add Silence/Padding
server.tool({
  name: "ffmpeg_add_silence",
  description: "Add silence before or after audio",
  inputSchema: {
    type: "object",
    properties: {
      input_file: { type: "string" },
      silence_before: { type: "number", default: 0, description: "Seconds" },
      silence_after: { type: "number", default: 0, description: "Seconds" },
      output_file: { type: "string" }
    },
    required: ["input_file", "output_file"]
  }
});

// Tool 13: Concatenate Audio Files
server.tool({
  name: "ffmpeg_concat",
  description: "Concatenate multiple audio files in sequence",
  inputSchema: {
    type: "object",
    properties: {
      input_files: { 
        type: "array", 
        items: { type: "string" },
        description: "Array of audio file paths in order"
      },
      crossfade_duration: { type: "number", default: 0, description: "Crossfade between files" },
      output_file: { type: "string" }
    },
    required: ["input_files", "output_file"]
  }
});
```

---

## 7. Error Handling & Rate Limiting

```typescript
// Error Response Interface
interface ElevenLabsError {
  status: number;
  error: {
    status: string;
    message: string;
  };
}

// Common Error Codes
const ERROR_CODES = {
  400: 'Bad Request - Invalid parameters',
  401: 'Unauthorized - Invalid API key',
  403: 'Forbidden - Insufficient permissions',
  429: 'Rate Limited - Too many requests',
  500: 'Server Error - Try again later'
};

// Rate Limit Handling
async function withRateLimit<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && retries < maxRetries - 1) {
        const waitTime = Math.pow(2, retries) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
      } else {
        throw error;
      }
    }
  }
}
```

---

## 8. Configuration & Presets

### 8.1 Voice Presets für Therapeutische Anwendungen

```typescript
const THERAPEUTIC_PRESETS = {
  meditation_calm: {
    voice_settings: {
      stability: 0.7,
      similarity_boost: 0.8,
      style: 0.2,
      use_speaker_boost: true
    },
    model_id: 'eleven_multilingual_v2'
  },
  
  meditation_warm: {
    voice_settings: {
      stability: 0.6,
      similarity_boost: 0.85,
      style: 0.4,
      use_speaker_boost: true
    },
    model_id: 'eleven_multilingual_v2'
  },
  
  hypnosis_deep: {
    voice_settings: {
      stability: 0.8,
      similarity_boost: 0.75,
      style: 0.1,
      use_speaker_boost: true
    },
    model_id: 'eleven_multilingual_v2'
  },
  
  energetic_motivation: {
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.9,
      style: 0.6,
      use_speaker_boost: true
    },
    model_id: 'eleven_turbo_v2_5'
  },
  
  children_storytelling: {
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.5,
      use_speaker_boost: true
    },
    model_id: 'eleven_turbo_v2_5'
  }
};
```

### 8.2 Music Presets

```typescript
const MUSIC_PRESETS = {
  meditation_ambient: {
    prompt: "Peaceful ambient meditation music with soft synthesizer pads, gentle nature sounds, slow harmonic progression, 60 BPM, deeply calming atmosphere",
    instrumental: true,
    music_length_ms: 300000 // 5 minutes
  },
  
  sleep_therapy: {
    prompt: "Ultra-slow ambient sleep music, barely audible drones, delta wave inducing frequencies, ethereal textures, minimal movement, 40 BPM or slower",
    instrumental: true,
    music_length_ms: 300000
  },
  
  yoga_flow: {
    prompt: "Flowing yoga music with indian instruments, tanpura drone, soft tabla rhythms, meditative sitar melodies, 80 BPM, peaceful and centered",
    instrumental: true,
    music_length_ms: 240000 // 4 minutes
  },
  
  nature_sounds: {
    prompt: "Natural soundscape with forest ambience, gentle stream water, soft bird calls, wind through leaves, no musical instruments, organic and peaceful",
    instrumental: true,
    music_length_ms: 300000
  },
  
  therapeutic_background: {
    prompt: "Soft therapeutic background music, gentle piano with subtle strings, slow tempo 55 BPM, warm and supportive, emotionally safe atmosphere",
    instrumental: true,
    music_length_ms: 180000 // 3 minutes
  }
};
```

---

## 9. File Management & Output

```typescript
interface OutputConfig {
  base_directory: string;           // Base output folder
  organize_by_date: boolean;        // Create date-based subfolders
  organize_by_type: boolean;        // Separate voice/music/sfx
  naming_convention: 'timestamp' | 'descriptive' | 'sequential';
  auto_backup: boolean;              // Copy to backup location
  metadata_json: boolean;            // Save generation metadata
}

// File naming examples
const generateFilename = (
  type: 'tts' | 'music' | 'sfx',
  config: OutputConfig,
  metadata?: any
): string => {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  
  switch (config.naming_convention) {
    case 'timestamp':
      return `${type}_${timestamp}.mp3`;
    
    case 'descriptive':
      const description = metadata?.text?.substring(0, 30).replace(/\s+/g, '_') || 'audio';
      return `${type}_${description}_${timestamp}.mp3`;
    
    case 'sequential':
      // Implementation with counter
      return `${type}_${getNextSequentialNumber(type)}.mp3`;
  }
};
```

---

## 10. Erweiterte Features

### 10.1 Caching & Performance

```typescript
// Cache häufig verwendete Stimmen und Einstellungen
interface VoiceCache {
  [voice_id: string]: {
    metadata: VoiceObject;
    last_used: Date;
    usage_count: number;
  };
}

// Batch-Processing für Effizienz
async function batchGenerate(
  requests: TTSRequest[],
  concurrency: number = 3
): Promise<string[]> {
  // Implement concurrent processing with rate limiting
}
```

### 10.2 Quality Assurance

```typescript
// Audio-Validierung nach Generierung
async function validateAudio(filepath: string): Promise<{
  valid: boolean;
  duration: number;
  sample_rate: number;
  bitrate: number;
  format: string;
}> {
  // FFmpeg probe implementation
}
```

### 10.3 Progress Tracking

```typescript
// Für lange Generierungen Progress-Updates
interface GenerationProgress {
  task_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
  estimated_completion: Date;
  result_url?: string;
  error?: string;
}
```

---

## 11. Testing & Beispiele

### Beispiel 1: Einfache Meditation erstellen

```typescript
// 1. Voice generieren
const voice = await elevenlabs_tts({
  text: "Willkommen zu dieser Entspannungsübung...",
  voice_id: "EkK5I93UQWFDigLMpZcX",
  model_id: "eleven_multilingual_v2",
  voice_settings: THERAPEUTIC_PRESETS.meditation_calm.voice_settings,
  output_path: "./temp/voice.mp3"
});

// 2. Musik generieren
const music = await elevenlabs_music({
  prompt: MUSIC_PRESETS.meditation_ambient.prompt,
  music_length_ms: 300000,
  instrumental: true,
  output_path: "./temp/music.mp3"
});

// 3. Mischen
const final = await ffmpeg_mix_audio({
  voice_file: "./temp/voice.mp3",
  music_file: "./temp/music.mp3",
  music_volume: 0.25,
  fade_in_duration: 3,
  fade_out_duration: 5,
  output_path: "./output/meditation_final.mp3"
});
```

### Beispiel 2: Komplexe Meditation mit Struktur

```typescript
const meditation = await elevenlabs_create_meditation({
  intro_text: "[softly, warmly] Willkommen...",
  main_text: "Spüre deinen Atem... [pause] ...",
  outro_text: "[whispers] Kehre langsam zurück...",
  background_music_prompt: "Ambient meditation music, 5 minutes",
  voice_id: "EkK5I93UQWFDigLMpZcX",
  total_duration_minutes: 5,
  output_path: "./output/complete_meditation.mp3"
});
```

---

## 12. Deployment & Configuration

### Environment Variables

```bash
# .env file
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxx
OUTPUT_BASE_DIR=/path/to/output
TEMP_DIR=/path/to/temp
FFMPEG_PATH=/usr/bin/ffmpeg
LOG_LEVEL=info
ENABLE_CACHING=true
MAX_CONCURRENT_REQUESTS=3
```

### MCP Server Configuration

```json
{
  "mcpServers": {
    "elevenlabs-complete": {
      "command": "node",
      "args": ["/path/to/elevenlabs-mcp-server/build/index.js"],
      "env": {
        "ELEVENLABS_API_KEY": "sk_xxxxxxxxxxxxx"
      }
    }
  }
}
```

---

## 13. Wichtige Hinweise für Claude Code

### Dokumentation zuerst lesen!

```
1. Besuche https://elevenlabs.io/docs/api-reference/introduction
2. Studiere die TTS, Music, und Sound Effects Endpoints
3. Beachte die neuesten V3 Features und Audio Tags
4. Überprüfe aktuelle Modell-IDs und Parameter
```

### Vollständigkeit

- Implementiere ALLE genannten Tools
- Nutze TypeScript für Type-Safety
- Ausführliches Error Handling
- Logging für Debugging
- Validation für alle Inputs

### Testing

- Unit Tests für jede Tool-Funktion
- Integration Tests mit echter API
- Beispiel-Workflows dokumentieren

### Performance

- Rate Limiting implementieren
- Caching wo sinnvoll
- Batch-Processing unterstützen
- Stream-Processing für große Files

---

## 14. Zusätzliche Features (Optional aber empfohlen)

1. **Web Dashboard:** Einfache UI zum Testen der Tools
2. **Presets Management:** CRUD für Custom Presets
3. **History Tracking:** Alle Generierungen loggen
4. **Cost Tracking:** API-Kosten überwachen
5. **Template System:** Vordefinierte Meditationen/Workflows
6. **Batch Import:** CSV mit Texten importieren
7. **Export Formats:** Verschiedene Audio-Formate
8. **Metadata Tags:** ID3-Tags für MP3s setzen

---

## Zusammenfassung

Dieser MCP Server soll die komplette ElevenLabs API abdecken mit besonderem Fokus auf:

✅ Text-to-Speech (alle Modelle, alle Parameter)
✅ Music Generation (mit Composition Plans)
✅ Sound Effects (mit Looping)
✅ Voice Management
✅ FFmpeg Integration für Mixing
✅ Batch Processing
✅ High-Level Workflow Tools (z.B. create_meditation)
✅ Presets für therapeutische Anwendungen
✅ Error Handling & Rate Limiting
✅ File Management & Organization

**Das Ziel:** Ein professionelles, produktionsreifes Tool für die Erstellung therapeutischer Audios mit maximaler Kontrolle und Flexibilität.

---

## Nächste Schritte für Claude Code

1. ✅ Dokumentation studieren (Links oben)
2. ✅ Projekt-Struktur aufsetzen (TypeScript + MCP SDK)
3. ✅ Core API Client implementieren
4. ✅ Alle 13 MCP Tools implementieren
5. ✅ FFmpeg Integration hinzufügen
6. ✅ Error Handling & Validation
7. ✅ Testing & Beispiele
8. ✅ Documentation & README

**Viel Erfolg! 🎯🎵**
