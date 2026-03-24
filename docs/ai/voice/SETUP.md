# Voice AI Setup Guide

## Overview

The Voice AI system consists of two parts:
1. **Bot Service** - Standalone service that joins meetings (deployed separately)
2. **Convex Functions** - Backend functions for scheduling and storing results

## Quick Start

### 1. Set Up Bot Service

```bash
cd bot-service
pnpm install
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your API keys:

```bash
# Bot Service Authentication
BOT_SERVICE_API_KEY=your-secret-key-here

# Convex Connection
CONVEX_URL=https://your-deployment.convex.cloud

# Transcription (at least one required — see "Transcription Providers" below)
SPEECHMATICS_API_KEY=xxxxx

# Summarization (required)
ANTHROPIC_API_KEY=sk-ant-xxxxx            # For Claude
```

### 3. Run Locally

```bash
pnpm dev
```

### 4. Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

## Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `BOT_SERVICE_API_KEY` | Secret key for Convex → Bot authentication |
| `CONVEX_URL` | Your Convex deployment URL |
| `ANTHROPIC_API_KEY` | Claude API key for summarization |

### Transcription Provider Keys

At least one transcription provider is required. The system rotates between providers based on remaining free-tier usage (~22 hrs/month total across all providers).

| Variable | Provider | Free Tier | Cost After Free |
|----------|----------|-----------|-----------------|
| `SPEECHMATICS_API_KEY` | Speechmatics | 8 hrs/month | ~$0.005/min |
| `GLADIA_API_KEY` | Gladia | 8 hrs/month | ~$0.005/min |
| `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` | Azure Speech | 5 hrs/month | ~$0.017/min |
| `GOOGLE_CLOUD_API_KEY` or `GOOGLE_CLOUD_PROJECT_ID` | Google Cloud STT | 1 hr/month | $0.024/min |

**Not included (and why):**
- OpenAI Whisper — no free tier ($0.006/min from dollar one)
- AssemblyAI — 100 hrs one-time credit only, not renewable monthly
- Deepgram — $200 one-time credit only, not renewable monthly

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Bot service port |
| `NODE_ENV` | development | Environment mode |
| `MAX_MEETING_DURATION` | 14400000 | Max duration (4 hours in ms) |

## Convex Configuration

Set these in Convex dashboard → Settings → Environment Variables:

```bash
# Bot Service Connection
BOT_SERVICE_URL=https://your-bot-service.railway.app
BOT_SERVICE_API_KEY=your-secret-key-here  # Same as bot service

# App URL (for callbacks)
SITE_URL=https://your-app.com
```

## Transcription Providers

### Speechmatics (Priority 1 — best free tier)

1. Sign up at [Speechmatics](https://www.speechmatics.com/)
2. Get API key from dashboard

```bash
SPEECHMATICS_API_KEY=xxxxx
```

- 8 hrs/month free, resets monthly
- Async job-based API (creates job, polls for completion)
- Uses "enhanced" model for better accuracy
- Speaker identification supported but not currently enabled in our code

### Gladia (Priority 2)

1. Sign up at [Gladia](https://www.gladia.io/)
2. Get API key from dashboard

```bash
GLADIA_API_KEY=xxxxx
```

- 8 hrs/month free, resets monthly
- Two-step process: upload file, then start transcription
- Speaker identification enabled by default — returns speaker-attributed segments
- Returns `speakerCount` in results

### Azure Speech Services (Priority 3)

1. Create Speech resource in [Azure Portal](https://portal.azure.com/)
2. Get key and region from resource

```bash
AZURE_SPEECH_KEY=xxxxx
AZURE_SPEECH_REGION=eastus  # or your region
```

- 5 hrs/month free, resets monthly
- REST API, sends raw audio buffer
- No speaker identification in current implementation

### Google Cloud Speech-to-Text (Priority 4 — smallest free tier)

1. Create project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Speech-to-Text API
3. Get API key or set up project ID

```bash
GOOGLE_CLOUD_API_KEY=xxxxx
# Or:
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

- 1 hr/month free (60 minutes), resets monthly
- Smart routing: synchronous for files under ~1 minute, async for longer
- Speaker identification enabled (hardcoded to 2 speakers)
- Uses `latest_long` model, WEBM_OPUS encoding, 48kHz sample rate

### Provider Rotation

The system automatically picks the provider with the most free-tier hours remaining each month. Priority order when free tiers are equal: Speechmatics → Gladia → Azure → Google.

Configure multiple providers for maximum free coverage:

```bash
# All four = ~22 hrs/month free
SPEECHMATICS_API_KEY=xxxxx        # 8 hrs
GLADIA_API_KEY=xxxxx              # 8 hrs
AZURE_SPEECH_KEY=xxxxx            # 5 hrs
AZURE_SPEECH_REGION=eastus
GOOGLE_CLOUD_API_KEY=xxxxx        # 1 hr
```

## Self-Hosted Transcription (Future — Not Yet Implemented)

> See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full build-vs-buy analysis.

These are the leading self-hosted options we plan to evaluate. Self-hosting eliminates
the 22hr/month free-tier ceiling and can add speaker identification to all transcripts.

### WhisperX (Recommended — All-in-One)

Bundles three things in one package:
1. **faster-whisper** — transcription (same accuracy as OpenAI Whisper, 4x faster)
2. **pyannote.audio** — speaker identification (who said what)
3. **Word-level timestamps** — via wav2vec2 forced alignment

- GitHub: https://github.com/m-bain/whisperX (~20,900 stars)
- License: BSD-2-Clause
- Requires: GPU for practical speed (CPU works but slow)
- Languages: 5+ with alignment models, 99+ for base transcription
- Estimated cost: ~$50-150/month for a GPU instance (unlimited hours)

```bash
# Example setup (not yet integrated)
pip install whisperx
whisperx audio.wav --model large-v3 --diarize --language en
```

### faster-whisper (Transcription Only)

If you don't need speaker identification or want to add it separately.

- GitHub: https://github.com/SYSTRAN/faster-whisper (~21,500 stars)
- License: MIT
- 4x faster than OpenAI Whisper with identical accuracy
- Runs on CPU (quantized int8) or GPU
- Large-v3 model needs ~4-6GB VRAM on GPU

### whisper.cpp (Lightweight / Edge)

Pure C/C++ port. Runs on anything — Raspberry Pi, mobile, browsers (WASM).

- GitHub: https://github.com/ggml-org/whisper.cpp (~47,500 stars)
- License: MIT
- Most resource-efficient option
- No speaker identification
- Best for: edge deployment, mobile apps, offline scenarios

### NVIDIA Parakeet / Canary (Best Accuracy)

Bleeding-edge accuracy if you have NVIDIA GPUs.

- Parakeet TDT 1.1B: **1.8% WER** (best in class), 2000x+ realtime speed
- Canary Qwen 2.5B: 5.6% WER, 418x realtime, multi-language
- Available via NVIDIA NeMo toolkit (Apache-2.0)
- Less community tooling than Whisper ecosystem

### Speaker Identification: pyannote.audio

The standard for figuring out "who said what" in audio.

- GitHub: https://github.com/pyannote/pyannote-audio (~9,400 stars)
- License: MIT
- Bundled in WhisperX (easiest path)
- Can also be used standalone with any transcription engine
- Requires HuggingFace token and model terms agreement
- 11-19% error rate on standard benchmarks

## Deployment Options

### Railway (Recommended)

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd bot-service
railway init

# Set environment variables
railway variables set BOT_SERVICE_API_KEY=your-key
railway variables set CONVEX_URL=https://your-deployment.convex.cloud
railway variables set SPEECHMATICS_API_KEY=xxxxx
railway variables set ANTHROPIC_API_KEY=sk-ant-xxxxx

# Deploy
railway up
```

### Docker

```dockerfile
FROM node:20-slim

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx playwright install chromium

EXPOSE 3001
CMD ["npm", "start"]
```

### Render / Fly.io

Similar to Railway - create a web service and set environment variables.

## Testing

### Health Check

```bash
curl http://localhost:3001/health
```

### Create Test Job

```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "recordingId": "test-recording-id",
    "meetingUrl": "https://meet.google.com/xxx-yyyy-zzz",
    "platform": "google_meet",
    "botName": "Test Bot"
  }'
```

### Check Job Status

```bash
curl http://localhost:3001/api/jobs/job-id \
  -H "Authorization: Bearer your-api-key"
```

## Security Considerations

1. **API Key Security**
   - Use strong, unique API keys
   - Rotate keys periodically
   - Never commit keys to version control
   - Bot service uses constant-time comparison to prevent timing attacks

2. **Network Security**
   - Use HTTPS in production
   - Restrict access to bot service API

3. **Meeting Access**
   - Bot appears as visible participant
   - Users see "Nixelo Notetaker" joined
   - Transparent recording notification

## Troubleshooting

### Bot service won't start

1. Check all required environment variables are set
2. Check Playwright is installed: `npx playwright install`
3. Check Node version (requires 20+)

### Can't connect to Convex

1. Verify `CONVEX_URL` is correct
2. Check Convex deployment is running
3. Verify API key matches on both sides

### Transcription fails

1. Check at least one transcription provider is configured
2. Verify API keys are valid and free tier not exhausted
3. Check provider-specific requirements (credentials format, region, etc.)
4. Check Convex `serviceUsage` table for provider usage stats

### Bot can't join meeting

1. Check meeting URL format is correct
2. Verify meeting allows anonymous joins
3. Check for waiting room settings
4. Review bot service logs

### Audio not captured

1. Check Playwright browser permissions
2. Verify audio elements are present
3. Check browser console for errors

### Speaker identification missing from transcript

Only Gladia and Google Cloud STT currently return speaker information. Speechmatics and Azure do not have it enabled in our code (even though Speechmatics supports it). Self-hosted WhisperX will solve this for all transcripts — see ARCHITECTURE.md.

## Monitoring

### Logs

```bash
# Railway
railway logs

# Local
pnpm dev  # Logs to console
```

### Metrics to Watch

- Job success rate
- Transcription duration
- Summary generation time
- Provider usage and remaining free-tier hours
- Speaker identification coverage (which providers returned speaker data)

---

**Related Documentation:**
- [Docs Index](../../README.md)
- [Architecture](./ARCHITECTURE.md)
- [Text AI Setup](../text/SETUP.md)

---

*Last Updated: 2026-03-23*
