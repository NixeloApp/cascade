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

At least one transcription provider is required. The system uses a 3-tier fallback: recurring free tiers first, then one-time credits, then paid.

**Tier 1 — Recurring monthly free tiers (~24 hrs/month):**

| Variable | Provider | Free Tier | Cost After Free |
|----------|----------|-----------|-----------------|
| `SPEECHMATICS_API_KEY` | Speechmatics | 8 hrs/month | ~$0.005/min |
| `GLADIA_API_KEY` | Gladia | 10 hrs/month | ~$0.01/min |
| `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` | Azure Speech | 5 hrs/month | ~$0.017/min |
| `GOOGLE_CLOUD_API_KEY` or `GOOGLE_CLOUD_PROJECT_ID` | Google Cloud STT | 1 hr/month | $0.024/min |

**Tier 2 — One-time credits (~885 hrs, burned after tier 1 exhausted):**

| Variable | Provider | Free Credit | Cost After Credit |
|----------|----------|-------------|-------------------|
| `DEEPGRAM_API_KEY` | Deepgram | ~700 hrs ($200 credit) | $0.0077/min |
| `ASSEMBLYAI_API_KEY` | AssemblyAI | 185 hrs | $0.035/min |

**Tier 3 — Paid fallback:** When all free/credits exhausted, Deepgram continues at $0.0077/min (cheapest option).

**Not included:** OpenAI Whisper — no free tier ($0.006/min from dollar one)

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

### Speechmatics (Tier 1 — Priority 1)

1. Sign up at [Speechmatics](https://www.speechmatics.com/)
2. Get API key from dashboard

```bash
SPEECHMATICS_API_KEY=xxxxx
```

- 8 hrs/month free, resets monthly
- Async job-based API (creates job, polls for completion)
- Uses "enhanced" model for better accuracy
- Speaker identification supported but not currently enabled in our code

### Gladia (Tier 1 — Priority 2)

1. Sign up at [Gladia](https://www.gladia.io/)
2. Get API key from dashboard

```bash
GLADIA_API_KEY=xxxxx
```

- 10 hrs/month free, resets monthly (verified 2026-03-23)
- Two-step process: upload file, then start transcription
- Speaker identification enabled by default — returns speaker-attributed segments
- Returns `speakerCount` in results

### Azure Speech Services (Tier 1 — Priority 3)

1. Create Speech resource in [Azure Portal](https://portal.azure.com/)
2. Get key and region from resource

```bash
AZURE_SPEECH_KEY=xxxxx
AZURE_SPEECH_REGION=eastus  # or your region
```

- 5 hrs/month free, resets monthly
- REST API, sends raw audio buffer
- No speaker identification in current implementation

### Google Cloud Speech-to-Text (Tier 1 — Priority 4)

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

### Deepgram (Tier 2 — one-time credit + cheapest paid)

1. Sign up at [Deepgram](https://deepgram.com/)
2. Get API key from console — $200 free credit is auto-applied

```bash
DEEPGRAM_API_KEY=xxxxx
```

- $200 one-time credit (~700 hours with Nova-3 model)
- After credit: $0.0077/min (cheapest paid option across all providers)
- Speaker identification via `diarize=true`
- Single API call (no upload step, send audio directly)
- Max 2 GB file size, 100 concurrent requests

### AssemblyAI (Tier 2 — one-time credit)

1. Sign up at [AssemblyAI](https://www.assemblyai.com/)
2. Get API key from dashboard — 185 hrs free credit auto-applied

```bash
ASSEMBLYAI_API_KEY=xxxxx
```

- 185 hrs one-time credit for pre-recorded audio
- After credit: $0.21/hr ($0.035/min) with Universal-3 Pro
- Speaker identification via `speaker_labels: true`
- Two-step process: upload file, then start transcription, then poll
- Includes automatic language detection

### Provider Rotation

The system uses a 3-tier fallback. Within each tier, it picks the provider with the most free capacity remaining.

**Tier 1 (recurring):** Speechmatics → Gladia → Azure → Google (resets monthly)
**Tier 2 (one-time):** Deepgram → AssemblyAI (burned only after tier 1 exhausted)
**Tier 3 (paid):** Deepgram at $0.0077/min (cheapest, used after all credits gone)

Configure all providers for maximum free coverage:

```bash
# Tier 1: ~24 hrs/month recurring
SPEECHMATICS_API_KEY=xxxxx        # 8 hrs/month
GLADIA_API_KEY=xxxxx              # 10 hrs/month
AZURE_SPEECH_KEY=xxxxx            # 5 hrs/month
AZURE_SPEECH_REGION=eastus
GOOGLE_CLOUD_API_KEY=xxxxx        # 1 hr/month

# Tier 2: ~885 hrs one-time
DEEPGRAM_API_KEY=xxxxx            # ~700 hrs ($200 credit)
ASSEMBLYAI_API_KEY=xxxxx          # 185 hrs
```

## Scaling Beyond Free Tiers

> See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full build-vs-buy analysis and cost comparison.

When free-tier hours aren't enough, there are two paths depending on volume:

### Path A: Skribby (low volume, <170 hrs/month)

Commercial transcription API at $0.35/hr. No infrastructure to manage.

- Single REST endpoint, 10+ transcription models (bring your own key)
- Includes speaker identification
- Meet, Zoom, Teams support
- Best for: getting started, proving demand before investing in infra

```bash
# Would be added as a new provider in bot-service
SKRIBBY_API_KEY=xxxxx
```

### Path B: Self-Hosted WhisperX (high volume, 170+ hrs/month)

At 170+ hrs/month, a dedicated GPU server is cheaper than any per-hour API. Flat ~$200/mo for unlimited hours.

#### What WhisperX Is

Bundles three things in one package:
1. **faster-whisper** — transcription (same accuracy as OpenAI Whisper, 4x faster)
2. **pyannote.audio** — speaker identification (who said what)
3. **Word-level timestamps** — via wav2vec2 forced alignment

- GitHub: https://github.com/m-bain/whisperX (~20,900 stars)
- License: BSD-2-Clause
- Languages: 5+ with alignment models, 99+ for base transcription

#### Hardware: Hetzner GEX44

| Spec | Value |
|------|-------|
| GPU | NVIDIA RTX 4000 SFF Ada, **20 GB VRAM** |
| CPU | Intel i5-13500 (14 cores) |
| RAM | 64 GB DDR4 |
| Storage | 2x 1.92 TB NVMe (RAID 1) |
| Price | EUR 184/mo (~$200 USD), EUR 212.30/mo from April 2026 |
| Setup fee | EUR 79 one-time |

#### VRAM Budget

WhisperX runs stages sequentially (models unloaded between stages):

| Stage | Peak VRAM |
|-------|-----------|
| Transcription (faster-whisper large-v3, int8) | ~3-5 GB |
| Alignment (wav2vec2) | ~0.5-1 GB |
| Speaker ID (pyannote.audio 4.0) | ~9.5 GB (known v4.0 regression, was 1.6 GB in v3.3) |
| **Peak at any one time** | **~9.5 GB** |

20 GB VRAM = comfortable headroom. Monitor pyannote upstream for VRAM fix.

#### Processing Speed

- **~3-6 minutes per hour of audio** (transcription + alignment + speaker ID)
- Can handle ~12 meetings/hour back-to-back
- Queuing only needed if 10+ meetings end at the exact same time

#### Audio Format Compatibility

Our Playwright bot outputs **WebM/Opus at 48kHz**. WhisperX uses ffmpeg internally to decode any format — WebM/Opus works directly, no conversion step needed.

#### Licensing (all commercial-friendly)

| Component | License | Notes |
|-----------|---------|-------|
| WhisperX | BSD-2-Clause | Commercial OK |
| faster-whisper | MIT | Commercial OK |
| pyannote.audio library | MIT | Commercial OK |
| pyannote speaker model | CC-BY-4.0 | Commercial OK, requires attribution |

pyannote requires a free HuggingFace account and accepting model terms (just clicks a button, shares your email). No paid license needed.

#### Python/CUDA Requirements

| Requirement | Version |
|-------------|---------|
| Python | >=3.10, <3.14 |
| CUDA Toolkit | 12.8 |
| PyTorch | ~=2.8.0 (with cu128) |
| ffmpeg | System dependency (must be installed separately) |

Use a Docker container with CUDA 12.8 base image to avoid dependency conflicts.

```bash
# Example usage (not yet integrated into our pipeline)
pip install whisperx
whisperx audio.webm --model large-v3 --diarize --language en
```

### Other Self-Hosted Engines (reference)

| Engine | Stars | Accuracy | Speaker ID | Best For |
|--------|-------|----------|------------|---------|
| **faster-whisper** | ~21,500 | ~7-8% WER | No | Transcription-only, lighter than WhisperX |
| **whisper.cpp** | ~47,500 | ~7-8% WER | No | Edge/mobile, runs on Raspberry Pi |
| **NVIDIA Parakeet** | N/A | **1.8% WER** | No | Best accuracy, NVIDIA GPUs only, early ecosystem |
| **Vosk** | ~14,400 | 10-15% WER | Basic | Real-time streaming, too inaccurate for us |

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
