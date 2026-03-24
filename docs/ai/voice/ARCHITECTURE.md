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
│  │                    Transcription Service                             │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐               │   │
│  │  │Speechm- │  │ Gladia  │  │  Azure  │  │ Google  │               │   │
│  │  │atics    │  │         │  │ Speech  │  │ Speech  │               │   │
│  │  │ 8hr/mo  │  │ 8hr/mo  │  │ 5hr/mo  │  │ 1hr/mo  │               │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘               │   │
│  │                                                                      │   │
│  │  Provider rotation based on free tier usage (~22 hrs/month total)   │   │
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

**Current Providers (free-tier rotation)**

| Provider | Free Tier | Cost After | Speaker ID | Notes |
|----------|-----------|------------|------------|-------|
| Speechmatics | 8 hrs/month | ~$0.005/min | No (supports it, not enabled) | Async job API, "enhanced" model |
| Gladia | 8 hrs/month | ~$0.005/min | Yes | Upload-then-transcribe flow, utterance-level segments |
| Azure Speech | 5 hrs/month | ~$0.017/min | No | REST API, raw audio buffer |
| Google Cloud STT | 1 hr/month | $0.024/min | Yes (hardcoded 2 speakers) | Smart routing: sync for <1min, async for longer |

**Excluded providers (documented in code):**
- OpenAI Whisper — no free tier ($0.006/min)
- AssemblyAI — 100 hrs one-time only (not renewable)
- Deepgram — $200 one-time credit only

**Provider Selection**
1. Query Convex for provider with most free tier remaining
2. Fall back to first configured provider
3. Record usage after transcription

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

**Don't rip-and-replace. Layer improvements incrementally:**

#### Phase 1 — Self-host transcription (immediate win, low risk)
Deploy **WhisperX** → eliminates all 4 paid providers, adds speaker identification, removes the 22hr/month free-tier ceiling.
- Cost: one GPU instance (~$50-150/month) for unlimited transcription
- Keeps our existing Playwright bot untouched
- Adds speaker identification to transcripts immediately

#### Phase 2 — Evaluate OSS meeting bots (2-4 week pilot)
Run **Vexa** in parallel with our Playwright bot.
- If Vexa handles Meet reliably → adopt it, get Zoom + Teams for free
- If too rough → fall back to **Attendee** (more mature) or keep custom bot for Meet

#### Phase 3 — Buy only if needed (enterprise demand)
Commercial APIs (Recall/Skribby) make sense only if:
- Enterprise customers demand SOC-2/HIPAA compliance
- We need Webex/Slack/GoTo platform coverage
- Self-hosted infra becomes a burden at scale

#### Cost Comparison (estimated 200 hrs meetings/month)

| Approach | Monthly Cost | Platforms | Speaker ID |
|----------|-------------|-----------|------------|
| **Current** (paid providers, 22hr free) | $0 for 22hrs, then ~$1-3/hr | Meet only | Partial (Gladia/Google only) |
| **Phase 1** (WhisperX self-hosted) | ~$100-150 (GPU instance) | Meet only | Yes |
| **Phase 1+2** (WhisperX + Vexa) | ~$150-200 (GPU + hosting) | Meet, Zoom, Teams | Yes |
| **Buy: Skribby** | ~$70 | Meet, Zoom, Teams | Depends on model |
| **Buy: Recall.ai** | ~$130 | 6 platforms | Yes |

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
