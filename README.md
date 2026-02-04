# ElevenLabs MCP Server

A comprehensive Model Context Protocol (MCP) server for ElevenLabs API integration. Generate professional text-to-speech, music, and sound effects directly from Claude Desktop or any MCP-compatible client.

**Target Audience:** Therapists, coaches, and content creators for producing meditations, therapeutic audios, and professional voice-overs.

## Features

- **Text-to-Speech (TTS)** - Generate natural speech with multiple models and voice settings
- **V3 Dialogue** - Multi-voice dialogue with emotional audio tags
- **Music Generation** - Create background music from text prompts
- **Sound Effects** - Generate cinematic sound effects
- **Voice Management** - Browse and filter available voices
- **Therapeutic Presets** - Pre-configured settings for meditation, hypnosis, and more

## Available Tools

| Tool | Description |
|------|-------------|
| `elevenlabs_list_voices` | List all available voices with filtering (language, gender, category) |
| `elevenlabs_get_voice` | Get detailed information about a specific voice |
| `elevenlabs_tts` | Generate speech from text with full voice control |
| `elevenlabs_tts_stream` | Generate speech with streaming (lower latency) |
| `elevenlabs_dialogue` | Generate dialogue with multiple voices and audio tags (V3) |
| `elevenlabs_music` | Generate music from text prompt |
| `elevenlabs_stream_music` | Generate music with streaming |
| `elevenlabs_sound_effect` | Generate sound effects from description |

## Installation

### Prerequisites

- Node.js 20 or higher
- ElevenLabs API key ([Get one here](https://elevenlabs.io))

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mcp-elevenlabs-api.git
cd mcp-elevenlabs-api
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## MCP Configuration

### Claude Desktop (Windows)

Add to your Claude Desktop configuration file at:
`%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "elevenlabs": {
      "command": "node",
      "args": ["C:\\path\\to\\mcp-elevenlabs-api\\build\\index.js"],
      "env": {
        "ELEVENLABS_API_KEY": "sk_your_api_key_here",
        "OUTPUT_DIR": "C:\\Users\\YourName\\ElevenLabs\\Output"
      }
    }
  }
}
```

### Claude Desktop (macOS)

Add to your Claude Desktop configuration file at:
`~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "elevenlabs": {
      "command": "node",
      "args": ["/path/to/mcp-elevenlabs-api/build/index.js"],
      "env": {
        "ELEVENLABS_API_KEY": "sk_your_api_key_here",
        "OUTPUT_DIR": "/Users/yourname/ElevenLabs/Output"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ELEVENLABS_API_KEY` | Yes | - | Your ElevenLabs API key |
| `OUTPUT_DIR` | No | `.` | Directory for generated audio files |
| `MAX_RETRIES` | No | `3` | Maximum API retry attempts |
| `RETRY_DELAY_MS` | No | `1000` | Base delay for exponential backoff |
| `LOG_LEVEL` | No | `info` | Logging level (debug, info, warn, error) |

## Usage Examples

### Generate TTS

```
Use elevenlabs_tts to say "Welcome to this meditation session" with the meditation_calm preset
```

### List German Voices

```
Use elevenlabs_list_voices to find German female voices
```

### Generate Background Music

```
Use elevenlabs_music to generate peaceful ambient meditation music, 2 minutes, instrumental only
```

### Generate Sound Effect

```
Use elevenlabs_sound_effect to create a Tibetan singing bowl sound, 10 seconds
```

### V3 Dialogue with Audio Tags

```
Use elevenlabs_dialogue with this text:
[softly, warmly] Welcome to this moment of peace.
[whispers] Close your eyes and relax.
[calmly] Take a deep breath in... and slowly release.
```

## Therapeutic Presets

### Voice Presets

| Preset | Description |
|--------|-------------|
| `meditation_calm` | High stability, calm and consistent delivery |
| `meditation_warm` | Warm, nurturing tone |
| `hypnosis_deep` | Very stable, deep and authoritative |
| `energetic_motivation` | Dynamic, motivational delivery |
| `children_storytelling` | Expressive, engaging for stories |

### Music Presets

| Preset | Description | Duration |
|--------|-------------|----------|
| `meditation_ambient` | Soft synthesizer pads, 60 BPM | 5 min |
| `sleep_therapy` | Ultra-slow ambient drones | 5 min |
| `yoga_flow` | Indian instruments, 80 BPM | 4 min |
| `nature_sounds` | Forest ambience, no instruments | 5 min |
| `therapeutic_background` | Gentle piano with strings | 3 min |

## V3 Audio Tags

Use these tags in your text for emotional expression (V3 model):

**Emotions:** happy, sad, angry, calm, excited, confident, worried

**Speaking Styles:** whispers, shouts, laughs, sighs, cries

**Tone Modifiers:** softly, loudly, warmly, coldly, slowly, quickly

**Special:** breathing, pause, emphasis

Example:
```
[softly, warmly] Welcome to this meditation.
[whispers] Let go of all tension.
[sighs] Feel the peace within.
```

## TTS Models

| Model | ID | Best For |
|-------|----|---------|
| Eleven V3 | `eleven_v3` | Audio tags, emotional expression |
| Multilingual V2 | `eleven_multilingual_v2` | High quality, multiple languages |
| Turbo V2.5 | `eleven_turbo_v2_5` | Fast generation, good quality |
| Flash V2.5 | `eleven_flash_v2_5` | Fastest, real-time applications |

## Output Formats

- `mp3_44100_128` (default) - High quality MP3
- `mp3_44100_192` - Highest quality MP3
- `mp3_44100_96` - Good quality MP3
- `mp3_44100_64` - Standard quality MP3
- `pcm_44100` - Uncompressed PCM (for further processing)

## Development

### Run in Development Mode

```bash
npm run dev
```

### Test with MCP Inspector

```bash
npm run inspect
```

### Project Structure

```
mcp-elevenlabs-api/
├── src/
│   ├── index.ts          # Main entry point
│   ├── api/
│   │   └── client.ts     # ElevenLabs API client
│   ├── config/
│   │   └── constants.ts  # API constants and presets
│   ├── tools/
│   │   ├── voices.ts     # Voice management tools
│   │   ├── tts.ts        # Text-to-speech tools
│   │   ├── dialogue.ts   # V3 dialogue tool
│   │   ├── music.ts      # Music generation tools
│   │   └── sound-effects.ts # Sound effects tool
│   └── types/
│       └── index.ts      # TypeScript types
├── build/                # Compiled JavaScript
├── package.json
└── tsconfig.json
```

## Troubleshooting

### "ELEVENLABS_API_KEY environment variable is required"

Make sure your API key is set in the MCP configuration `env` section.

### "Unauthorized - Invalid API key"

Verify your API key is correct and has not expired.

### "Rate Limited"

The server automatically retries with exponential backoff. If you frequently hit rate limits, consider upgrading your ElevenLabs plan.

### Files not saving

Ensure the `OUTPUT_DIR` exists and has write permissions. The server will create it automatically if it doesn't exist.

## License

GPL-3.0

## Links

- [ElevenLabs API Documentation](https://elevenlabs.io/docs/api-reference/introduction)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
