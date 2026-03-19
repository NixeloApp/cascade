# Meeting AI & PM Platform Landscape

> Comprehensive analysis of competitors, open source alternatives, and infrastructure options for Nixelo's meeting intelligence + project management platform.
>
> **Last Updated:** 2026-01-20

---

## Table of Contents

1. [Market Positioning](#market-positioning)
2. [Infrastructure APIs (Recall.ai Alternatives)](#infrastructure-apis)
3. [End-User Products (Read AI Competitors)](#end-user-products)
4. [Open Source Solutions](#open-source-solutions)
5. [All-in-One PM Tools](#all-in-one-pm-tools)
6. [NPM Packages & Libraries](#npm-packages--libraries)
7. [Technical Architecture Comparison](#technical-architecture-comparison)
8. [Pricing Analysis](#pricing-analysis)
9. [Build vs Buy Decision Matrix](#build-vs-buy-decision-matrix)
10. [Nixelo's Differentiators](#nixelos-differentiators)

---

## Market Positioning

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MARKET LAYERS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 3: ALL-IN-ONE PLATFORMS                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ Nixelo  │ │ClickUp │ │ Monday  │ │  Coda   │ │ Plane   │              │
│  │ (You)   │ │         │ │         │ │         │ │         │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│       │                                                                     │
│       │ (Only Nixelo has native meeting intelligence)                       │
│       ▼                                                                     │
│  LAYER 2: END-USER MEETING PRODUCTS                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ Read AI │ │Fireflies│ │ Otter   │ │  tl;dv  │ │  Gong   │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│       │                                                                     │
│       │ (Built on infrastructure layer or custom bots)                      │
│       ▼                                                                     │
│  LAYER 1: INFRASTRUCTURE / APIs                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                           │
│  │Recall.ai│ │  Nylas  │ │MeetBaaS │ │ Skribby │                           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                           │
│       │                                                                     │
│       │ (Or build your own with open source / Playwright)                   │
│       ▼                                                                     │
│  LAYER 0: PRIMITIVES                                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                           │
│  │Playwright│ │ Whisper │ │ Claude  │ │ FFmpeg  │                           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Infrastructure APIs

### Recall.ai

> **What it is:** Bot-as-a-Service API. They run meeting bots, you call their API.

| Attribute | Details |
|-----------|---------|
| **Website** | https://www.recall.ai |
| **Docs** | https://docs.recall.ai |
| **Type** | Paid API |
| **Platforms** | Zoom, Google Meet, Microsoft Teams, Webex, Slack Huddles, GoTo Meeting |

**Pricing:**
| Item | Cost |
|------|------|
| Recording | $0.50/hour |
| Transcription (optional) | $0.15/hour |
| Storage (first 7 days) | Free |
| Storage (after 7 days) | $0.05/hour/month |
| Free tier | 5 hours to start |
| Minimum commitment | None (pay-as-you-go) |

**Features:**
- Custom bot name (`bot_name` parameter) - can be "Nixelo Notetaker"
- Real-time audio/video streaming
- Webhook notifications
- Participant metadata (emails, names)
- Per-second billing proration
- 99.9% uptime SLA
- SOC2, ISO 27001, GDPR, CCPA, HIPAA compliant

**Pros:**
- Zero maintenance - they handle platform UI changes
- All major platforms supported
- Enterprise-grade reliability
- Compliance certifications included
- Simple REST API

**Cons:**
- Costs add up at scale ($0.50/hr = $500/1000 hrs)
- Black box - no control over bot behavior
- Dependent on their uptime
- No self-hosting option

**API Example:**
```bash
curl -X POST https://us-east-1.recall.ai/api/v1/bot \
  -H 'Authorization: Token YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "meeting_url": "https://meet.google.com/abc-xyz",
    "bot_name": "Nixelo Notetaker"
  }'
```

**Best for:** Teams who want to focus on product, not bot infrastructure. Low-medium volume (&lt;100 hrs/mo).

---

### Nylas Notetaker

> **What it is:** API-first meeting assistant for developers.

| Attribute | Details |
|-----------|---------|
| **Website** | https://www.nylas.com |
| **Comparison** | https://www.nylas.com/comparison/recall-ai-alternative/ |
| **Type** | Paid API |
| **Platforms** | Zoom, Google Meet, Microsoft Teams |

**Pricing:**
- No platform fee (unlike Recall.ai's enterprise tier)
- Pay per use
- Contact for specific rates

**Pros:**
- Part of larger Nylas ecosystem (email, calendar APIs)
- Easier integration if already using Nylas
- No minimum commitment

**Cons:**
- Less documentation than Recall.ai
- Smaller community
- Fewer platform integrations

**Best for:** Teams already using Nylas for email/calendar.

---

### Meeting BaaS

> **What it is:** "Meetings-as-a-Service" - Recall.ai alternative with self-hosting option.

| Attribute | Details |
|-----------|---------|
| **Website** | https://www.meetingbaas.com |
| **Type** | Paid API + Self-hosted option |
| **Platforms** | Google Meet, Zoom, Microsoft Teams |

**Pricing:**
- Claims "80% of Recall.ai functionality at 50% cost"
- Self-onboarding, pay-as-you-go
- Self-hosted option on AWS (1 day setup)

**Pros:**
- Can self-host for full control
- Lower cost than Recall.ai
- Developer-first approach

**Cons:**
- Smaller company, less proven at scale
- Fewer integrations
- Less documentation

**Best for:** Cost-conscious teams who want option to self-host later.

---

### Skribby

> **What it is:** Developer-friendly meeting bot API focused on reliability.

| Attribute | Details |
|-----------|---------|
| **Website** | https://skribby.io |
| **Type** | Paid API |
| **Platforms** | Google Meet, Zoom, Microsoft Teams |

**Pricing:**
- Contact for rates
- Positioned as simpler/cheaper than Recall.ai

**Pros:**
- Simple API design
- Reliability-focused
- Good developer experience

**Cons:**
- Newer, less proven
- Smaller feature set
- Limited documentation publicly available

---

## End-User Products

> **Evidence Note:** Where competitor-specific docs use `[inference]`, `[speculation]`, or
> `[conflict]`, this summary should be read with the same confidence level. The detailed
> competitor docs are the canonical place for nuance.

### Read AI

> **What it is:** AI meeting assistant with coaching, search, and meeting-quality features.

| Attribute | Details |
|-----------|---------|
| **Website** | https://www.read.ai |
| **Type** | End-user SaaS |
| **Platforms** | Google Meet, Zoom, Microsoft Teams |

**Features:**
- Meeting transcription, summaries, uploads, and playback
- Speaker Coach and engagement-oriented meeting analysis
- Search Copilot / cross-workflow search
- Messaging and email product areas
- Workspaces and admin controls
- Desktop, mobile, and Chrome-extension surface

**Pricing:**
- Free / Pro / Enterprise / Enterprise+
- Free: `$0`, `5 meeting transcripts per month`
- Pro: `$19.75/user/mo` monthly or `$15/user/mo` annual
- Enterprise: `$29.75/user/mo` monthly or `$22.50/user/mo` annual
- Enterprise+: `$39.75/user/mo` monthly or `$29.75/user/mo` annual
- [conflict] Older repo notes referenced `Pro+`, but the current mirrored pricing page does not

**Pros:**
- Clearer differentiation than plain transcript tools
- Strong coaching / engagement story
- Broader product ambition across meetings, search, email, and messaging
- Verified workspace and pricing structure

**Cons:**
- Still a standalone intelligence layer, not a PM system
- People-scoring can create privacy / culture risk
- Older repo notes overstated implementation certainty

**Nixelo Advantage:** Native PM integration - action items become issues automatically.

---

### Fireflies.ai

> **What it is:** Meeting assistant focused on transcription, AI notes, and workflow
> integrations.

| Attribute | Details |
|-----------|---------|
| **Website** | https://fireflies.ai |
| **Type** | End-user SaaS |
| **Platforms** | Zoom, Google Meet, Teams, Webex, + more |

**Features:**
- Auto-join meetings from calendar
- 100+ languages
- "AskFred" AI assistant
- API and integrations
- CRM / dialer workflows
- Team analytics and conversation intelligence
- Security / trust / admin packaging

**Pricing:**
| Tier | Cost | Features |
|------|------|----------|
| Free | $0 | 800 min storage/seat, limited AI summaries |
| Pro | $10/user/mo annual (`$18` monthly) | 8,000 min storage, AskFred, unlimited integrations |
| Business | $19/user/mo annual (`$29` monthly) | Unlimited storage, video recording, team analytics |
| Enterprise | $39/user/mo | SSO, SCIM, HIPAA, private storage, retention controls |

**Pros:**
- Very clear public packaging
- Aggressive annual pricing
- Strong integration-first story
- Mature enterprise controls in higher tiers

**Cons:**
- Still a sidecar product
- AI credits complicate the simple seat-price story
- Lacks native PM execution context

---

### Otter.ai

> **What it is:** Transcription-first meeting assistant with strong live-capture UX.

| Attribute | Details |
|-----------|---------|
| **Website** | https://otter.ai |
| **Type** | End-user SaaS |
| **Platforms** | Zoom, Google Meet, Microsoft Teams |

**Features:**
- Real-time transcription visible during meeting
- OtterPilot (auto-join bot)
- Live collaboration on transcripts
- AI Chat
- MCP server integration for AI assistants
- File imports and searchable meeting archive
- Enterprise admin controls

**Pricing:**
| Tier | Cost | Transcription |
|------|------|---------------|
| Basic | Free | 300 mins/mo, 30 min per conversation |
| Pro | `$8.33/user/mo` annual (`$16.99` monthly) | 1,200 mins/mo |
| Business | `$19.99/user/mo` annual (`$24` promo / `$30` list monthly) | Unlimited meeting transcription, 4 hours per meeting |
| Enterprise | Custom | SSO, HIPAA, enterprise controls |

**Pros:**
- Strongest live-transcription identity in the set
- Explicit pricing and quota details
- Mature enterprise packaging
- Queryable archive is becoming more agent-friendly

**Cons:**
- Still behaves like a destination app
- Lower tiers stay constrained
- PM actioning remains shallow

---

### tl;dv

> **What it is:** Recorder-first meeting product with simple adoption messaging and newer AI
> insight layers.

| Attribute | Details |
|-----------|---------|
| **Website** | https://tldv.io |
| **Type** | End-user SaaS |
| **Platforms** | Zoom, Google Meet, Microsoft Teams |

**Features:**
- Free Forever positioning
- AI recorder for Zoom, Google Meet, and Microsoft Teams
- AI notes and summaries
- AI Agents for Meetings / AI Agents for Sales
- Multi-Meeting AI Insights
- 30+ languages
- 6000+ tool integrations

**Pricing:**
| Tier | Cost | Features |
|------|------|----------|
| Free | Verified | Free Forever tier is confirmed from homepage capture |
| Pro | [conflict] Exists in older notes | Exact current price not locally verified |
| Business | [conflict] Exists in older notes | Exact current price not locally verified |
| Enterprise | [inference] Sales-led | Security / enterprise packaging is implied, but exact pricing is not mirrored locally |

**Pros:**
- Very clear top-of-funnel story
- Approachable recorder-first product surface
- Broader AI story than older notes suggested
- Strong integration and platform messaging

**Cons:**
- Exact paid pricing remains unresolved in this repo
- Still a sidecar recorder, not a work system
- Older growth and roadmap notes are mostly speculative locally

---

### Gong.io

> **What it is:** Revenue intelligence platform (overkill for most, but worth knowing).

| Attribute | Details |
|-----------|---------|
| **Website** | https://gong.io |
| **Type** | Enterprise SaaS |
| **Platforms** | All major meeting platforms |

**Features:**
- Meeting recording & transcription
- Deal intelligence
- Pipeline / forecast intelligence
- Gong Engage
- Gong Forecast
- Gong Revenue Graph
- Gong AI and Gong AI Agents

**Pricing:**
- Licenses are priced per user
- Platform fee depends on number of users supported
- Existing tech stack can be integrated for free
- Enterprise sales process / customized proposal flow
- [conflict] Older repo notes had exact dollar figures, but the current mirrored pricing page does not

**Pros:**
- Strongest strategic product identity in the set
- Category-leading revenue-intelligence framing
- Clear enterprise platform family
- 5,000+ customers shown on pricing page

**Cons:**
- Not a general-purpose meeting tool
- Quote-only pricing is hard to compare quickly
- Poor fit for engineering / PM workflows

---

## Open Source Solutions

### Meetily (meeting-minutes)

> **What it is:** Privacy-first desktop app that captures system audio. **NOT** a bot that joins meetings.

| Attribute | Details |
|-----------|---------|
| **GitHub** | https://github.com/Zackriya-Solutions/meeting-minutes |
| **Website** | https://meetily.zackriya.com |
| **Stars** | 4,500+ |
| **License** | Open Source |

**Tech Stack:**
- Rust (43.7%) - Core engine
- TypeScript/Next.js (29.5%) - Frontend
- Tauri - Desktop framework
- Whisper.cpp - Local transcription
- Ollama - Local summarization

**How It Works:**
```
Your Computer
    │
    ├── Meetily App Running
    │       │
    │       ├── Captures system audio (like screen recording)
    │       ├── Transcribes locally with Whisper
    │       └── Summarizes with Ollama or Claude
    │
    └── NO bot joins the meeting - invisible to other participants
```

**Features:**
- 100% local processing (no cloud)
- Real-time transcription (4x faster with Parakeet)
- Speaker diarization
- GPU acceleration (Metal/CoreML on Mac, CUDA on Windows)
- Works with ANY meeting platform (captures system audio)
- SQLite + VectorDB for semantic search

**Platforms:**
- macOS
- Windows
- Linux (build from source)

**Pros:**
- Completely free and private
- No bot visible to other participants
- Works with ANY audio source
- Local AI = no API costs
- Active development, 17k+ users

**Cons:**
- Desktop app only - must be on YOUR computer
- Can't record meetings you're not in
- No "Nixelo Notetaker" bot joining
- Requires decent hardware for local AI
- Not a SaaS you can offer to users

**Use Case for Nixelo:** Reference for local transcription, Whisper integration, desktop app architecture. NOT a replacement for bot-based approach.

---

### screenappai/meeting-bot

> **What it is:** Open source bot that joins meetings via Playwright. Closest to Recall.ai functionality.

| Attribute | Details |
|-----------|---------|
| **GitHub** | https://github.com/screenappai/meeting-bot |
| **Type** | Standalone service (not npm package) |
| **License** | Open Source |

**Tech Stack:**
- TypeScript / Node.js
- Playwright (browser automation)
- Docker
- Redis (job queue)
- S3/Azure Blob Storage

**How It Works:**
```
Your Server
    │
    └── Docker Container
            │
            ├── Express API (receives job requests)
            ├── Redis Queue (manages jobs)
            └── Playwright Browser
                    │
                    └── Bot joins meeting as participant
                        "Recording Bot" visible to others
```

**Features:**
- Google Meet support ✅
- Zoom support ✅
- Microsoft Teams support ✅
- REST API for job management
- Redis queue for scaling
- S3/Azure storage integration
- Prometheus metrics
- Webhook notifications
- Graceful shutdown

**API Endpoints:**
```
POST /api/recording/start    - Start recording
POST /api/recording/stop     - Stop recording
GET  /api/recording/status   - Get status
```

**Pros:**
- All 3 major platforms supported
- Production-ready architecture
- Redis queue for scaling
- Well-documented
- Can customize bot name

**Cons:**
- Must deploy and maintain yourself
- Breaks when platforms change UI (you fix it)
- No transcription included (audio only)
- No AI summarization included

**Deployment:**
```bash
git clone https://github.com/screenappai/meeting-bot
cd meeting-bot
docker-compose up
```

**Use Case for Nixelo:** Primary reference for adding Zoom/Teams support. Can fork and adapt.

---

### Vexa

> **What it is:** Self-hosted multi-user API for meeting bots with real-time transcription.

| Attribute | Details |
|-----------|---------|
| **GitHub** | https://github.com/Vexa-ai/vexa |
| **Type** | Self-hosted API |
| **License** | Open Source |

**Tech Stack:**
- TypeScript / Node.js
- Docker
- PostgreSQL
- WebSocket (real-time streaming)

**Features:**
- Real-time transcription (WebSocket streaming)
- Multi-language support (100 languages)
- Real-time translation
- Speaker diarization
- Full self-hosting capability
- Multi-user/tenant architecture

**Pros:**
- Real-time streaming (not just post-meeting)
- Built for multi-tenant SaaS
- Good for regulated industries (fintech, medical)

**Cons:**
- Google Meet only (currently)
- More complex setup
- Less community than screenappai

**Use Case for Nixelo:** Reference for real-time transcription streaming, multi-tenant architecture.

---

### Hyprnote

> **What it is:** Local-first AI notepad with meeting transcription (macOS only).

| Attribute | Details |
|-----------|---------|
| **Website** | https://openalternative.co/hyprnote |
| **Type** | Desktop app |
| **License** | GPL-3.0 |

**Features:**
- Apple Notes-like interface
- Local Whisper transcription
- Custom HyperLLM-V1 for summaries (1.1GB model)
- Fully offline capable
- Bot-free (captures system audio)

**Pros:**
- Beautiful UI
- Completely offline
- No data leaves device

**Cons:**
- macOS only (Windows coming)
- Desktop app, not SaaS
- No bot joining

**Use Case for Nixelo:** Reference for local LLM summarization, offline-first architecture.

---

### Scriberr

> **What it is:** Self-hosted web app for audio transcription.

| Attribute | Details |
|-----------|---------|
| **GitHub** | https://github.com/rishikanthc/Scriberr |
| **Type** | Web app (self-hosted) |
| **License** | Open Source |

**Tech Stack:**
- Node.js
- Whisper / Parakeet models
- PWA support

**Features:**
- Upload audio → get transcript
- Speaker diarization
- Ollama/OpenAI chat integration
- Folder watcher for automation
- Multiple output formats (JSON, TXT, CSV)
- PWA for mobile

**Pros:**
- Simple self-hosted transcription
- Good API for automation
- Speaker diarization

**Cons:**
- No meeting bot (upload audio manually)
- Not real-time
- Basic UI

**Use Case for Nixelo:** Reference for transcription pipeline, speaker diarization.

---

### recallai/google-meet-meeting-bot

> **What it is:** Recall.ai's own open source reference implementation.

| Attribute | Details |
|-----------|---------|
| **GitHub** | https://github.com/recallai/google-meet-meeting-bot |
| **Type** | Reference implementation |

**Tech Stack:**
- Playwright
- Express
- Prisma (PostgreSQL)
- OpenAI (summarization)

**Pros:**
- From Recall.ai themselves
- Well-architected
- Good learning resource

**Cons:**
- Google Meet only
- Requires second Google account
- Reference code, not maintained product

**Use Case for Nixelo:** Learning resource for bot architecture patterns.

---

## All-in-One PM Tools

### Comparison Matrix

| Feature | Nixelo | Linear | Jira | Notion | ClickUp | Plane.so |
|---------|--------|--------|------|--------|---------|----------|
| Issues/Tasks | ✅ | ✅ | ✅ | ⚠️ Basic | ✅ | ✅ |
| Kanban Boards | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sprint Planning | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Docs/Wiki | ✅ | ❌ | ⚠️ Confluence | ✅ | ✅ | ✅ |
| Real-time Collab | ✅ | ❌ | ❌ | ✅ | ⚠️ | ⚠️ |
| Meeting Bot | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Transcription | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI Summaries | ✅ | ❌ | ⚠️ Plugin | ⚠️ AI | ⚠️ AI | ❌ |
| Action → Issue | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Calendar | ✅ | ❌ | ❌ | ⚠️ Basic | ✅ | ❌ |
| Open Source | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Self-hosted | ❌ | ❌ | ✅ DC | ❌ | ❌ | ✅ |

### Linear

| Attribute | Details |
|-----------|---------|
| **Website** | https://linear.app |
| **Positioning** | Modern issue tracking (Jira killer) |
| **Pricing** | Free for small teams, $8/user/mo |

**Pros:** Beautiful UI, fast, developer-loved
**Cons:** No docs, no meetings, no wiki

---

### Notion

| Attribute | Details |
|-----------|---------|
| **Website** | https://notion.so |
| **Positioning** | Docs + databases (wiki-first) |
| **Pricing** | Free tier, $8-15/user/mo |

**Pros:** Flexible, great for docs, large ecosystem
**Cons:** Not a real PM tool, databases are clunky for issues

---

### Plane.so

| Attribute | Details |
|-----------|---------|
| **Website** | https://plane.so |
| **GitHub** | https://github.com/makeplane/plane |
| **Positioning** | Open source Jira/Linear alternative |
| **Pricing** | Free (self-hosted), paid cloud |

**Pros:** Open source, self-hostable, modern UI
**Cons:** No meeting intelligence, smaller ecosystem

---

## NPM Packages & Libraries

### Meeting Bot Layer

**No good packages exist.** Everything is either:
- Full apps to fork (screenappai/meeting-bot)
- Paid APIs (Recall.ai)
- Raw primitives (Playwright)

```typescript
// ❌ This doesn't exist
import { MeetingBot } from 'meeting-bot-sdk';

// ✅ What exists - raw Playwright
import { chromium } from 'playwright';
// ...then 200+ lines of platform-specific code
```

---

### Transcription Layer

| Package | Type | Install | Notes |
|---------|------|---------|-------|
| **nodejs-whisper** | Local Whisper | `npm i nodejs-whisper` | CPU-based, auto WAV conversion |
| **whisper-node** | Local Whisper | `npm i whisper-node` | Word timestamps support |
| **whisper-live** | Real-time | `npm i whisper-live` | Streaming transcription |
| **openai** | Cloud API | `npm i openai` | Whisper API ($0.006/min) |

```typescript
// Local transcription
import { whisper } from 'nodejs-whisper';
const result = await whisper('audio.wav', { model: 'base' });

// Cloud transcription (OpenAI Whisper)
import OpenAI from 'openai';
const openai = new OpenAI();
const transcript = await openai.audio.transcriptions.create({
  file: fs.createReadStream('audio.mp3'),
  model: 'whisper-1',
});
```

---

### AI/Summary Layer

| Package | Provider | Install |
|---------|----------|---------|
| **@anthropic-ai/sdk** | Claude | `npm i @anthropic-ai/sdk` |
| **openai** | GPT-4 | `npm i openai` |
| **ollama** | Local LLMs | `npm i ollama` |

```typescript
// Claude (what you're using)
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic();
const summary = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  messages: [{ role: 'user', content: transcript }],
});

// Local LLM (free, private)
import { Ollama } from 'ollama';
const ollama = new Ollama();
const response = await ollama.chat({
  model: 'llama2',
  messages: [{ role: 'user', content: transcript }],
});
```

---

## Technical Architecture Comparison

### Your Current Bot-Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NIXELO BOT-SERVICE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│  │   Express   │────▶│   Bot       │────▶│  Playwright │              │
│  │   API       │     │   Manager   │     │  Browser    │              │
│  │  (port 4444)│     │  (in-memory)│     │             │              │
│  └─────────────┘     └─────────────┘     └─────────────┘              │
│         │                   │                   │                      │
│         │                   │                   ▼                      │
│         │                   │            ┌─────────────┐              │
│         │                   │            │ Google Meet │              │
│         │                   │            │ (Joins as   │              │
│         │                   │            │  Nixelo     │              │
│         │                   │            │  Notetaker) │              │
│         │                   │            └─────────────┘              │
│         │                   │                   │                      │
│         │                   │                   ▼ Audio                │
│         │                   │            ┌─────────────┐              │
│         │                   │            │   Temp      │              │
│         │                   │            │   Storage   │              │
│         │                   │            └─────────────┘              │
│         │                   │                   │                      │
│         │                   ▼                   ▼                      │
│         │            ┌─────────────────────────────────┐              │
│         │            │     TRANSCRIPTION SERVICE       │              │
│         │            │  ┌─────────┐ ┌─────────┐       │              │
│         │            │  │Speechmat│ │ Gladia  │       │              │
│         │            │  └─────────┘ └─────────┘       │              │
│         │            │  ┌─────────┐ ┌─────────┐       │              │
│         │            │  │ Azure   │ │ Google  │       │              │
│         │            │  └─────────┘ └─────────┘       │              │
│         │            │     (Provider Rotation)         │              │
│         │            └─────────────────────────────────┘              │
│         │                          │                                   │
│         │                          ▼                                   │
│         │            ┌─────────────────────────────────┐              │
│         │            │      SUMMARY SERVICE            │              │
│         │            │   Claude Opus 4.5               │              │
│         │            │   - Executive summary           │              │
│         │            │   - Action items                │              │
│         │            │   - Decisions                   │              │
│         │            │   - Key points                  │              │
│         │            └─────────────────────────────────┘              │
│         │                          │                                   │
│         │                          ▼                                   │
│         │            ┌─────────────────────────────────┐              │
│         ▼            │       CONVEX BACKEND            │              │
│  ┌─────────────┐     │   - meetingRecordings           │              │
│  │   Convex    │◀────│   - transcripts                 │              │
│  │   HTTP      │     │   - summaries                   │              │
│  │   Client    │     │   - participants                │              │
│  └─────────────┘     └─────────────────────────────────┘              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### screenappai/meeting-bot Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCREENAPPAI/MEETING-BOT                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│  │   Express   │────▶│   Redis     │────▶│   Bot       │              │
│  │   API       │     │   Queue     │     │   Worker    │              │
│  └─────────────┘     └─────────────┘     └─────────────┘              │
│                                                 │                       │
│                            ┌────────────────────┼────────────────────┐ │
│                            │                    │                    │ │
│                            ▼                    ▼                    ▼ │
│                     ┌───────────┐        ┌───────────┐        ┌─────────┐
│                     │  Google   │        │   Zoom    │        │  Teams  │
│                     │   Meet    │        │           │        │         │
│                     │   Bot     │        │   Bot     │        │   Bot   │
│                     └───────────┘        └───────────┘        └─────────┘
│                            │                    │                    │ │
│                            └────────────────────┼────────────────────┘ │
│                                                 ▼                       │
│                                          ┌─────────────┐              │
│                                          │  S3/Azure   │              │
│                                          │  Storage    │              │
│                                          └─────────────┘              │
│                                                                         │
│  Key Differences:                                                       │
│  - Redis queue (better scaling)                                        │
│  - All 3 platforms supported                                           │
│  - Cloud storage integration                                           │
│  - NO transcription/summary (audio only)                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Pricing Analysis

### Infrastructure Cost Comparison (Monthly)

| Volume | Recall.ai | Self-Hosted Bot | Your Current |
|--------|-----------|-----------------|--------------|
| 10 hrs | $5 | $10-20 (server) | $10-20 (server) |
| 50 hrs | $25 | $10-20 | $10-20 |
| 100 hrs | $50 | $20-30 | $20-30 |
| 500 hrs | $250 | $50-100 | N/A (Meet only) |
| 1000 hrs | $500 | $100-200 | N/A |

**Crossover point:** ~40-50 hrs/month (below = Recall.ai wins, above = self-host wins)

### Full Stack Cost (10 hrs/month usage)

| Component | Recall.ai Route | Self-Hosted Route |
|-----------|-----------------|-------------------|
| Meeting Bot | $5 (Recall.ai) | $10-20 (server) |
| Transcription | $1.50 (Recall) or $0 (free tiers) | $0 (free tiers) |
| AI Summary | $5-20 (Claude API) | $5-20 (Claude API) |
| Backend | $0-25 (Convex) | $0-25 (Convex) |
| **Total** | **$11-50/mo** | **$15-65/mo** |

### 5-Year Total Cost of Ownership

| Approach | 5-Year Cost | Notes |
|----------|-------------|-------|
| Recall.ai + Claude | ~$3,500 | Zero maintenance |
| Self-hosted bot + Claude | ~$2,000 | You maintain bot |
| Self-hosted + Local LLM | ~$1,000 | Maximum DIY |

---

## Build vs Buy Decision Matrix

| Factor | Build Yourself | Use Recall.ai |
|--------|----------------|---------------|
| **Monthly cost (&lt;50 hrs)** | Higher | Lower |
| **Monthly cost (&gt;100 hrs)** | Lower | Higher |
| **Time to Zoom/Teams** | Weeks | Hours |
| **Maintenance burden** | You fix when platforms break | Zero |
| **Customization** | Full control | Limited to API |
| **Data privacy** | Full control | Their servers |
| **Learning opportunity** | High | Low |
| **Reliability** | Depends on you | 99.9% SLA |
| **Compliance (SOC2)** | You handle | Included |

### Recommendation by Stage

| Stage | Recommendation | Why |
|-------|----------------|-----|
| **Now (just you)** | Keep your bot OR try Recall.ai | Either works at low volume |
| **Early users (10-50)** | Keep building your own | Learn, iterate, control |
| **Growth (50-200 users)** | Evaluate: maintenance vs cost | Depends on team bandwidth |
| **Scale (200+ users)** | Either works | Self-hosted cheaper, Recall.ai easier |

---

## Nixelo's Differentiators

### What Makes Nixelo Different

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  OTHER TOOLS (Read AI, Fireflies, Linear, Notion, etc.)                │
│                                                                         │
│  Meeting Tool ──────────────────────▶ Summary/Transcript                │
│       │                                      │                          │
│       │         (Manual copy-paste)          │                          │
│       ▼                                      ▼                          │
│  PM Tool (Jira/Linear) ◀─────────────── Action Items                   │
│       │                                                                 │
│       │         (Manual linking)                                        │
│       ▼                                                                 │
│  Docs (Notion/Confluence)                                               │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  NIXELO                                                                 │
│                                                                         │
│  Meeting ────▶ Transcript ────▶ AI Summary ────▶ Action Items          │
│     │              │                │                 │                 │
│     │              │                │                 │                 │
│     ▼              ▼                ▼                 ▼                 │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │              UNIFIED DATA LAYER (Convex)                 │          │
│  │                                                          │          │
│  │  Meetings ◀──────▶ Issues ◀──────▶ Docs ◀──────▶ Sprints│          │
│  │     │                 │              │              │    │          │
│  │     └─────────────────┴──────────────┴──────────────┘    │          │
│  │                    All Connected                         │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Unique Value Props

1. **Meeting → Issue Pipeline**
   - Action item detected in meeting
   - Auto-creates issue in project
   - Assigns to team member mentioned
   - Links to sprint if discussed
   - References in related docs

2. **Unified Search**
   - "Find all discussions about authentication"
   - Returns: meeting clips + issues + docs
   - All in one place

3. **Context Preservation**
   - Issue shows: "Created from meeting on Jan 15"
   - Click to see exact moment discussed
   - Full context, not just text

4. **Single Source of Truth**
   - No sync issues between tools
   - No "which tool has the latest?"
   - One platform, all data

### Competitive Positioning

| Competitor | Their Strength | Nixelo's Counter |
|------------|----------------|------------------|
| Read AI | Best meeting UX | Native PM integration |
| Linear | Best issue tracking UX | + Meetings + Docs |
| Notion | Most flexible docs | + Real PM + Meetings |
| Jira | Enterprise features | Modern UX + Meetings |
| ClickUp | Feature-rich | Focused + Meeting AI |

---

## Summary & Recommendations

### For Meeting Bot Infrastructure

1. **Current state:** Your bot-service works for Google Meet
2. **To add Zoom/Teams:** Fork screenappai/meeting-bot or use Recall.ai
3. **At scale:** Self-hosted is cheaper, Recall.ai is easier

### For Transcription

1. **Keep your multi-provider rotation** - smart cost optimization
2. **Consider adding:** Local Whisper option via `nodejs-whisper`
3. **Future:** Real-time transcription via Vexa patterns

### For AI Summary

1. **Keep Claude** - best quality for meeting summaries
2. **Consider adding:** Ollama option for privacy-conscious users
3. **Future:** Fine-tuned model for your specific summary format

### For Overall Product

1. **Your differentiator is integration, not any single feature**
2. **Meeting bot is commodity** - don't over-invest
3. **Focus on the magic:** Meeting → Issue → Sprint → Doc connections
4. **Open source references:** Use them to accelerate, not replace your vision

---

## Links & Resources

### Infrastructure APIs
- [Recall.ai](https://www.recall.ai) | [Docs](https://docs.recall.ai)
- [Nylas Notetaker](https://www.nylas.com)
- [Meeting BaaS](https://www.meetingbaas.com)
- [Skribby](https://skribby.io)

### End-User Products
- [Read AI](https://www.read.ai)
- [Fireflies.ai](https://fireflies.ai)
- [Otter.ai](https://otter.ai)
- [tl;dv](https://tldv.io)
- [Gong.io](https://gong.io)

### Open Source
- [screenappai/meeting-bot](https://github.com/screenappai/meeting-bot)
- [Meetily](https://github.com/Zackriya-Solutions/meeting-minutes)
- [Vexa](https://github.com/Vexa-ai/vexa)
- [Scriberr](https://github.com/rishikanthc/Scriberr)
- [Hyprnote](https://openalternative.co/hyprnote)
- [recallai/google-meet-meeting-bot](https://github.com/recallai/google-meet-meeting-bot)

### NPM Packages
- [nodejs-whisper](https://www.npmjs.com/package/nodejs-whisper)
- [whisper-node](https://www.npmjs.com/package/whisper-node)
- [@anthropic-ai/sdk](https://www.npmjs.com/package/@anthropic-ai/sdk)
- [openai](https://www.npmjs.com/package/openai)

### PM Tools
- [Linear](https://linear.app)
- [Notion](https://notion.so)
- [Plane.so](https://plane.so) (open source)
- [ClickUp](https://clickup.com)
