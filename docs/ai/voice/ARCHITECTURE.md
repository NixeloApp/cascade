# Voice AI Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Nixelo Application                                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Calendar UI    │───►│  MeetingRecording│───►│  Convex: meetingBot.ts  │  │
│  │  Component      │    │  Section         │    │  - scheduleRecording    │  │
│  └─────────────────┘    └─────────────────┘    │  - cancelRecording      │  │
│                                                 │  - listRecordings       │  │
│                                                 └───────────┬─────────────┘  │
└───────────────────────────────────────────────────────────┬─────────────────┘
                                                            │
                                                            │ HTTP (scheduled job)
                                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Bot Service (Railway)                                │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Express API    │───►│  Bot Manager    │───►│  Google Meet Bot        │  │
│  │  (index.ts)     │    │  (manager.ts)   │    │  (google-meet.ts)       │  │
│  │                 │    │                 │    │                         │  │
│  │  POST /api/jobs │    │  Job queue      │    │  Playwright browser     │  │
│  │  GET /api/jobs  │    │  Status tracking│    │  Audio capture          │  │
│  └─────────────────┘    └─────────────────┘    └───────────┬─────────────┘  │
│                                                            │                │
│                                                            │ Audio file     │
│                                                            ▼                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Transcription Service (3-tier fallback)           │   │
│  │                                                                      │   │
│  │  Tier 1 — Recurring monthly:                                        │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐               │   │
│  │  │Speechm. │  │ Gladia  │  │  Azure  │  │ Google  │               │   │
│  │  │ 8hr/mo  │  │ 10hr/mo │  │ 5hr/mo  │  │ 1hr/mo  │               │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘               │   │
│  │                                                                      │   │
│  │  Tier 2 — One-time credits:                                         │   │
│  │  ┌──────────────┐  ┌──────────────┐                                 │   │
│  │  │ Deepgram     │  │ AssemblyAI   │                                 │   │
│  │  │ ~700hrs 1x   │  │ 185hrs 1x    │                                 │   │
│  │  └──────────────┘  └──────────────┘                                 │   │
│  │                                                                      │   │
│  │  Tier 3 — Paid: Deepgram Nova-3 @ $0.0077/min                      │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                       │
│                                     │ Transcript                            │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Summary Service (Claude)                          │   │
│  │                                                                      │   │
│  │  - Executive summary                                                 │   │
│  │  - Key points extraction                                             │   │
│  │  - Action item detection                                             │   │
│  │  - Decision tracking                                                 │   │
│  │  - Topic segmentation                                                │   │
│  │  - Sentiment analysis                                                │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      │ HTTP (results callback)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Nixelo (Convex)                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Transcript     │    │  Summary        │    │  Action Items           │  │
│  │  Storage        │    │  Storage        │    │  → Issues (optional)    │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Current Runtime Reality

> **Important:** The schema supports Google Meet, Zoom, and Teams, but the runtime
> only implements Google Meet. Zoom and Teams have types and scheduling UI but no
> bot execution. This is intentional v1 scoping, not a bug.

**What's working today:**
- Playwright-based Chromium bot joins Google Meet via URL
- Audio captured via Web Audio API + MediaRecorder (browser-side mixing)
- 4 transcription providers with free-tier rotation (~22 hrs/month free)
- Claude-powered structured summarization
- Full status lifecycle in Convex with real-time UI updates
- 10 test files covering security, SSRF, race conditions, perf

**What's not working today:**
- No speaker identification in transcripts (who said what)
- Zoom/Teams bot execution (schema only)
- Jobs are in-memory (lost on bot service restart)
- Sequential processing only (transcribe then summarize, not parallel)
- No desktop/system-level audio capture

## Component Details

### 1. Frontend Layer

**Calendar UI Component**
- Displays calendar events with meeting links
- Shows recording status indicator
- Triggers recording schedule/cancel

**MeetingRecordingSection**
- Platform detection (Google Meet, Zoom, Teams)
- Recording controls UI
- Status display

### 2. Convex Backend

**meetingBot.ts**
```typescript
// Key functions
scheduleRecording()   // Creates recording job
cancelRecording()     // Cancels scheduled job
listRecordings()      // Lists recordings for event
updateRecordingStatus() // Updates status from bot service
```

**Database Tables**
```typescript
meetingRecordings: {
  eventId: Id<"calendarEvents">,
  status: "scheduled" | "joining" | "recording" | ...
  meetingUrl: string,
  platform: "google_meet" | "zoom" | "teams",
  botJobId?: string,
  transcript?: string,
  summary?: MeetingSummary,
  error?: string,
}
```

### 3. Bot Service

**Express API (index.ts)**
```
POST /api/jobs      - Create new bot job
GET  /api/jobs/:id  - Get job status
GET  /api/jobs      - List active jobs
POST /api/jobs/:id/stop - Stop running job
GET  /health        - Health check
```

**Bot Manager (manager.ts)**
- Job queue management
- Status tracking
- Concurrent job limiting
- Error handling and retries

**Google Meet Bot (google-meet.ts)**
- Playwright browser automation
- Meeting join logic
- Audio capture via Web Audio API + MediaRecorder
- Participant detection
- Meeting end detection (explicit message + timeout)
- Max 4-hour duration limit

### 4. Transcription Service

**Provider Interface**
```typescript
interface TranscriptionProvider {
  name: string;
  isConfigured(): boolean;
  transcribe(audioPath: string): Promise<TranscriptionResult>;
}

interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;
  modelUsed: string;
  processingTime: number;
  wordCount: number;
  speakerCount?: number;
  durationMinutes: number;
}
```

**3-Tier Provider System**

Providers are tried in order: recurring free tiers first, then one-time credits, then paid.

| Tier | Provider | Free Tier | Cost After | Speaker ID | Notes |
|------|----------|-----------|------------|------------|-------|
| 1 | Speechmatics | 8 hrs/month | ~$0.005/min | No (supports it, not enabled) | Async job API, "enhanced" model |
| 1 | Gladia | 10 hrs/month | ~$0.01/min | Yes | Upload-then-transcribe, utterance-level segments |
| 1 | Azure Speech | 5 hrs/month | ~$0.017/min | No | REST API, raw audio buffer |
| 1 | Google Cloud STT | 1 hr/month | $0.024/min | Yes (hardcoded 2 speakers) | Smart routing: sync for <1min, async for longer |
| 2 | Deepgram | ~700 hrs one-time ($200 credit) | $0.0077/min | Yes | Nova-3 model, cheapest paid rate |
| 2 | AssemblyAI | 185 hrs one-time | $0.035/min | Yes | Universal-3 Pro, language detection |

**Totals:**
- Tier 1 (recurring): ~24 hrs/month
- Tier 2 (one-time): ~885 hrs (lasts months at normal usage)
- Tier 3 (paid): Deepgram at $0.0077/min after one-time credits run out

**Not included:** OpenAI Whisper (no free tier, $0.006/min)

**Provider Selection**
1. Query Convex for provider with most free tier remaining (tier 1 → tier 2 → tier 3)
2. Fall back to first configured provider
3. Record usage after transcription

**Considered and rejected: smart routing by context** (e.g. route 2-speaker calls to Google Cloud STT, noisy audio to Speechmatics). Not worth it — we can't reliably know speaker count or audio quality before the meeting starts. Calendar attendees don't predict who actually joins. Audio quality detection requires processing first, defeating the purpose. The 3-tier rotation maximizes free usage automatically without user input.

### 5. Summary Service

**Claude Integration**
```typescript
class SummaryService {
  async summarize(transcript: string): Promise<MeetingSummary>;
  async quickSummary(transcript: string): Promise<string>;
}
```

**Output Structure**
```typescript
interface MeetingSummary {
  executiveSummary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
  openQuestions: string[];
  topics: Topic[];
  overallSentiment: "positive" | "neutral" | "negative" | "mixed";
  modelUsed: string;
  promptTokens?: number;
  completionTokens?: number;
  processingTime: number;
}
```

## Data Flow

### Recording Flow

```
1. User clicks "Record" on calendar event
   └─► MeetingRecordingSection.scheduleRecording()

2. Convex creates recording record
   └─► meetingBot.scheduleRecording()
   └─► Status: "scheduled"

3. Convex scheduler triggers at meeting time
   └─► HTTP POST to bot service /api/jobs

4. Bot service creates job
   └─► BotManager.createJob()
   └─► Status: "joining"

5. Playwright joins meeting
   └─► GoogleMeetBot.join()
   └─► Status: "recording"

6. Audio captured during meeting
   └─► Audio buffer accumulated

7. Meeting ends (or manually stopped)
   └─► Status: "processing"

8. Audio sent to transcription
   └─► TranscriptionService.transcribe()
   └─► Status: "transcribing"

9. Transcript sent to Claude
   └─► SummaryService.summarize()
   └─► Status: "summarizing"

10. Results sent back to Convex
    └─► HTTP callback to Convex
    └─► Status: "completed"
```

### Error Handling Flow

```
Error at any step:
└─► Catch error
└─► Log details
└─► Update status to "failed"
└─► Store error message
└─► Notify Convex via callback
```

---

## Build vs Buy vs Borrow: Capture Strategy

> Research conducted 2026-03-23. Prices and star counts will drift — verify before making purchasing decisions.

### The Problem

Our custom Playwright bot works for Google Meet but:
- Each bot runs a full Chromium instance (hundreds of MB RAM)
- DOM selectors break when Google updates Meet's UI
- No path to Zoom/Teams without building separate bots
- No speaker identification (who said what)
- Free-tier rotation caps out at ~22 hrs/month

### Option A: Open-Source Meeting Bots (Borrow)

Replace our custom Playwright bot with an existing OSS project that already handles multi-platform meeting joining.

| Project | Stars | License | Platforms | What It Is |
|---------|-------|---------|-----------|------------|
| **Vexa** | ~1,800 | Apache-2.0 | Meet, Zoom, Teams | Most feature-rich. Built-in Whisper transcription, real-time WebSocket streaming, MCP server for AI agents, speaking bot support. Three deployment tiers: full self-host, GPU-free (outsource transcription), or hosted SaaS at vexa.ai |
| **Attendee** | ~522 | Open source | Meet, Zoom, Teams | Most mature (3,766 commits, 30 contributors, v1.21.0). Django app in a single Docker image. Per-participant audio streams, webhooks, calendar integration. Claims 10x cost reduction vs commercial |
| **ScreenApp Bot** | ~111 | MIT | Meet, Zoom, Teams | TypeScript/Playwright — closest to our current stack. Redis queue, Prometheus metrics, S3/Azure Blob storage. Same fundamental fragility as our bot (DOM selectors) but production-hardened |
| **MeetingBot** | ~252 | LGPL-3.0 | Meet, Zoom, Teams | IaC via Terraform on AWS. TypeScript + Next.js + tRPC. Good if we want AWS-native. LGPL is more restrictive |

**Verdict:**
- **Vexa** is the best pick — Apache-2.0 (no license headaches), all 3 platforms, built-in transcription eliminates provider rotation, real-time streaming, and MCP server aligns with our agent-layer roadmap
- **Attendee** is the runner-up if we want battle-tested maturity over features
- **ScreenApp Bot** only makes sense if we want to stay Playwright-based but get queue/monitoring for free

### Option B: Commercial Meeting Bot APIs (Buy)

Pay per hour to eliminate all infrastructure overhead.

| Provider | Cost/hr | Platforms | Self-Host? | Key Differentiator |
|----------|---------|-----------|------------|--------------------|
| **Skribby** | $0.35 | Meet, Zoom, Teams | No | Cheapest. 10+ transcription models (bring your own key). Single REST endpoint. Direct CTO support |
| **MeetingBaaS** | $0.066 self-host / ~$0.50 cloud | Meet, Zoom, Teams | Yes (BSL license) | Source-available. On-prem self-host is remarkably cheap. BSL converts to Apache-2.0 after 18 months. Speaking bots via Pipecat |
| **Recall.ai** | $0.50 + $0.15 txn | Meet, Zoom, Teams, Webex, Slack, GoTo | No | Market leader ($38M Series B). Broadest platform coverage (6 platforms). SOC-2/HIPAA compliance. Desktop Recording SDK (invisible, no bot joins meeting). Most expensive |

**Verdict:**
- **Skribby** is the move if we just want this solved cheaply with no infra work
- **MeetingBaaS** self-hosted at $0.066/hr is interesting if we want source access + low cost
- **Recall.ai** only makes sense if enterprise customers demand SOC-2/HIPAA or we need Webex/Slack/GoTo

### Option C: Self-Hosted Transcription (Replace Paid Providers)

Replace our 4 paid API providers with self-hosted models. Eliminates the 22hr/month free-tier ceiling and adds speaker identification.

#### Transcription Engines

| Engine | GitHub Stars | Accuracy (WER) | Speed | GPU Required? | Speaker ID | Languages |
|--------|-------------|-----------------|-------|---------------|------------|-----------|
| **WhisperX** | ~20,900 | ~7-8% | 70x realtime | Yes (practical) | Yes (built-in via pyannote) | 5+ with alignment models |
| **faster-whisper** | ~21,500 | ~7-8% | 4x faster than Whisper | No (but helps) | No | 99+ |
| **whisper.cpp** | ~47,500 | ~7-8% | CPU-native fast | No | No | 99+ |
| **Vosk** | ~14,400 | 10-15% (worse) | Real-time streaming | No | Basic | 20+ |
| **NVIDIA Parakeet** | N/A | **1.8%** (best) | 2000x+ realtime | Yes (NVIDIA only) | No | English |
| **NVIDIA Canary** | N/A | 5.6% | 418x realtime | Yes (NVIDIA only) | No | Multi-language |

**What is WER?** Word Error Rate — lower is better. 7-8% means roughly 1 in 13 words is wrong. 1.8% means roughly 1 in 55 words is wrong.

**Verdict:**
- **WhisperX** is the best all-in-one choice — bundles faster-whisper for transcription + pyannote.audio for speaker identification + word-level timestamps. One package solves transcription AND tells you who said what
- **faster-whisper** alone if we want to add speaker identification separately or don't need it yet
- **NVIDIA Parakeet/Canary** if we get NVIDIA GPUs and want bleeding-edge accuracy (watch this space)
- **whisper.cpp** for edge/mobile if we ever go that direction
- **Vosk** only for real-time streaming where latency matters more than accuracy

#### Speaker Identification Tools

Speaker identification = figuring out "who said what" in a recording. Without it, transcripts are just a wall of text with no way to tell speakers apart.

| Tool | GitHub Stars | Error Rate (DER) | Best For |
|------|-------------|-------------------|----------|
| **pyannote.audio 4.0** | ~9,400 | 11-19% | Most developers. Best balance of accuracy, ease of use, community. MIT license. Bundled in WhisperX |
| **NVIDIA NeMo** | N/A | ~9% (2-speaker) | Enterprise on NVIDIA GPUs. More complex setup |
| **SpeechBrain** | N/A | Varies | Researchers who need custom pipelines |

**What is DER?** Diarization Error Rate — lower is better. 11% means roughly 1 in 9 speech segments is attributed to the wrong speaker.

**Verdict:** Use **pyannote.audio** via WhisperX. It's MIT-licensed, production-ready, and integrated out of the box.

### Recommended Strategy

**The right approach depends on volume. Don't overspend on infra before you have the meetings to justify it.**

#### Volume-Based Decision Guide

| Monthly Meeting Hours | Best Path | Monthly Cost | Why |
|-----------------------|-----------|-------------|-----|
| **<50 hrs** | Stay current (free tiers) | $0 | 22 free hrs covers most of it, not worth paying yet |
| **50-170 hrs** | **Skribby** (commercial API) | $18-60 | Cheapest per-hour option, no infra, includes speaker ID |
| **170+ hrs** | **Self-host WhisperX** on Hetzner | ~$200 flat | Breakeven vs paid APIs; unlimited hours from here |
| **500+ hrs** | Self-host WhisperX | ~$200 flat | $0.40/hr effective cost and dropping. Clear winner |

#### Phase 1 — Start with Skribby (low volume, no infra)
Use **Skribby** ($0.35/hr) as the transcription provider. Single REST endpoint, 10+ transcription models (bring your own key), includes speaker identification. No servers to manage.
- Swap in as a new provider in `bot-service/src/services/transcription-providers/`
- Keep existing free-tier providers as fallback
- Get speaker identification immediately
- Evaluate real meeting volume over 1-2 months

#### Phase 2 — Self-host when volume justifies it (170+ hrs/month)
Deploy **WhisperX** on **Hetzner GEX44** → flat $200/mo for unlimited hours.
- **Server:** Hetzner GEX44 — RTX 4000 SFF Ada (20 GB VRAM), i5-13500, 64 GB RAM, 2x 1.92 TB NVMe
- **Price:** EUR 184/mo (~$200 USD), EUR 79 one-time setup fee (goes to EUR 212.30/mo from April 2026)
- **Processing speed:** ~3-6 minutes per hour of audio (transcription + alignment + speaker ID)
- **Capacity:** ~12 meetings/hour back-to-back. Queuing only needed if 10+ meetings end simultaneously
- **Audio format:** Our WebM/Opus at 48kHz works directly — WhisperX uses ffmpeg internally, no conversion needed
- **VRAM budget:** Peak ~9.5 GB (pyannote 4.0 speaker ID is the bottleneck). 20 GB gives comfortable headroom
- **Licensing:** All MIT/CC-BY-4.0, commercial use OK. pyannote needs free HuggingFace account + model terms acceptance (just clicks a button)

#### Phase 3 — Evaluate OSS meeting bots for multi-platform
Run **Vexa** in parallel with our Playwright bot.
- If Vexa handles Meet reliably → adopt it, get Zoom + Teams for free
- If too rough → fall back to **Attendee** (more mature) or keep custom bot for Meet

#### Phase 4 — Buy premium only if needed (enterprise demand)
Commercial bot APIs (Recall.ai) make sense only if:
- Enterprise customers demand SOC-2/HIPAA compliance
- We need Webex/Slack/GoTo platform coverage
- Self-hosted infra becomes a burden at scale

#### Cost at Scale

| Monthly Hours | Current (paid APIs) | Skribby ($0.35/hr) | Self-host ($200 flat) |
|---------------|---------------------|---------------------|----------------------|
| 22 hrs | $0 (free tier) | $8 | $200 |
| 50 hrs | ~$42 | $18 | $200 |
| 100 hrs | ~$120 | $35 | $200 |
| 200 hrs | ~$270 | $70 | **$200** |
| 500 hrs | ~$720 | $175 | **$200** |
| 1,000 hrs | ~$1,500 | $350 | **$200** |

**Breakeven: self-hosting beats paid APIs at ~170 hrs/month. Below that, Skribby wins.**

### Why Not LiveKit?

LiveKit is an open-source real-time communication framework (SFU) with an Agents SDK for building AI participants. It's great if you build your own video conferencing. But it **cannot join external meetings** — Google Meet, Zoom, and Teams don't expose public WebRTC endpoints for third-party bots. Browser automation (Playwright) remains the only universal approach for joining meetings you don't control.

LiveKit becomes relevant if we ever:
- Build our own video conferencing inside Nixelo
- Need a real-time AI processing backbone (pair with a browser bot for capture + LiveKit for STT/LLM/TTS streaming)

---

## Scaling Considerations

### Current Limitations

- Single bot per meeting
- Max 4 hour meeting duration
- Sequential transcription processing
- Single bot service instance
- In-memory job tracking (lost on restart)

### Future Scaling Options

1. **Multiple Bot Instances**
   - Load balancer for bot service
   - Job distribution across instances

2. **Parallel Processing**
   - Chunk audio for parallel transcription
   - Multiple Claude calls for long meetings

3. **Queue System**
   - Redis/RabbitMQ for job queue
   - Better job distribution
   - Persistent job state (survives restarts)

## Security Model

### Authentication

```
Convex → Bot Service:
  - BOT_SERVICE_API_KEY in Authorization header
  - Constant-time comparison (prevents timing attacks)
  - Validated by auth middleware

Bot Service → Convex:
  - HTTP client with Convex URL
  - No additional auth (internal API)
```

### Data Security

- Audio files: Temporary, deleted after processing
- Transcripts: Stored in Convex (encrypted at rest)
- API keys: Environment variables only

### Meeting Privacy

- Bot appears as visible participant
- Name clearly indicates recording
- Meeting host can remove bot

## Monitoring Points

### Key Metrics

| Metric | Location | Purpose |
|--------|----------|---------|
| Job success rate | Bot service logs | Reliability |
| Join time | Bot manager | Performance |
| Transcription time | Transcription service | Cost tracking |
| Summary time | Summary service | Performance |
| Provider usage | Convex serviceUsage table | Cost optimization |

### Log Points

```typescript
// Bot service
console.log(`Job ${jobId}: Status changed to ${status}`);
console.log(`Transcription completed: ${provider} (${duration}min)`);
console.log(`Summary generated: ${tokenCount} tokens`);

// Convex
console.log(`Recording ${id}: Scheduled for ${meetingTime}`);
console.log(`Recording ${id}: Completed successfully`);
```

---

**Related Documentation:**
- [Docs Index](../../README.md)
- [Setup Guide](./SETUP.md)
- [Bot Service Code](../../../bot-service/)

---

*Last Updated: 2026-03-23*
