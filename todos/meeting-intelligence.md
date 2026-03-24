# Meeting Intelligence

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-24
>
> Full architecture & build-vs-buy analysis: `docs/ai/voice/ARCHITECTURE.md`
> Transcription upgrade tasks & hardware specs: `human-todos/ai-recording-todos.md`

---

## Done

- [x] Document current runtime reality -- custom bot-service, Google Meet-first, richer backend than UI
- [x] Research build-vs-buy options (completed 2026-03-23)
- [x] 3-tier provider system built and integrated
- [x] Deepgram provider (`deepgram.ts`) — $200 one-time credit (~700 hrs), speaker ID, Nova-3 model
- [x] AssemblyAI provider (`assemblyai.ts`) — 185 hrs one-time credit, speaker ID, language detection
- [x] Provider registry updated with 6 providers in 3 tiers
- [x] Convex seed data updated (Gladia corrected to 10hrs/month, Deepgram + AssemblyAI added as disabled)
- [x] Docs updated (ARCHITECTURE.md, SETUP.md, .env files)
- [x] Considered and rejected smart routing by context (speaker count, audio quality) — can't know before meeting starts, not worth the complexity. Documented in ARCHITECTURE.md.

---

## Current Provider System

3-tier fallback — burn recurring free tiers first, then one-time credits, then paid:

**Tier 1 — Recurring monthly (~24 hrs/month):**

| Provider | Free Tier | Cost After | Speaker ID | Notes |
|----------|-----------|------------|------------|-------|
| Speechmatics | 8 hrs/month | ~$0.005/min | No (supports it, not enabled in code) | Best accuracy for accents |
| Gladia | 10 hrs/month | ~$0.01/min | Yes | Most free hours, includes translation |
| Azure | 5 hrs/month | ~$0.017/min | No | Enterprise reliability |
| Google Cloud STT | 1 hr/month | $0.024/min | Yes (hardcoded 2 speakers) | Barely worth it at 1hr but free is free |

**Tier 2 — One-time credits (~885 hrs, disabled until API keys added):**

| Provider | Credit | Cost After | Speaker ID | Notes |
|----------|--------|------------|------------|-------|
| Deepgram | ~700 hrs ($200 credit) | $0.0077/min | Yes | Best overall — cheapest, fastest, cleanest API |
| AssemblyAI | 185 hrs | $0.035/min | Yes | Solid backup, pricier than Deepgram after credits |

**Tier 3 — Paid fallback:** Deepgram at $0.0077/min (cheapest) after all credits exhausted.

**At 50 hrs/month, the one-time credits alone last ~17 months before touching paid tier.**

---

## Blocked

### Document Editor Dependency (blocks meeting-to-doc)

- [ ] Clarify template/document seeding -- `createDocumentFromTemplate` returns `templateContent` but the Plate workflow has no clean e2e initialization
- [ ] Separate real collaboration from stubs -- `ConvexYjsProvider` is explicitly a stub, should not be treated as shipped

### Meeting-to-Doc Flow

- [ ] Add meeting-to-doc flow -- create or append a project document from meeting results (blocked by above)

---

## Next Up — Human Decisions

- [ ] Sign up for Deepgram, get API key, add `DEEPGRAM_API_KEY` to bot-service `.env`
- [ ] Sign up for AssemblyAI, get API key, add `ASSEMBLYAI_API_KEY` to bot-service `.env`
- [ ] Run Convex seed to register new providers: `npx convex run serviceRotation:seedProviders`
- [ ] Test: record a short meeting, verify Deepgram/AssemblyAI transcription works
- [ ] **Decision needed:** what's our expected monthly meeting volume? Determines if/when to self-host:

| Monthly Hours | Best Path | Cost/mo |
|---------------|-----------|---------|
| <50 hrs | Stay current (free tiers + one-time credits) | $0 |
| 50-170 hrs | Current system, credits last months | $0 |
| 170+ hrs | Self-host WhisperX on Hetzner GEX44 | ~$200 flat |

---

## Next Up — Code

### Speaker Identification (partially addressed)

> Deepgram and AssemblyAI (tier 2) both return speaker labels. Gladia and Google Cloud STT (tier 1) also return partial speaker data. Speechmatics and Azure do not.

- [ ] Enable Speechmatics speaker identification in our existing code (it supports it, we just didn't turn it on)
- [ ] Update transcript UI to show speaker labels
- [ ] Update summary prompt to use speaker names for action item attribution ("Sarah volunteered to..." instead of "someone said...")

### Screenshots & Visual QA

- [ ] Visual review of captured screenshots for quality (no spinners, real content)

---

## Future — Multi-Platform

### Platform Breadth

- [ ] Close Zoom/Teams schema/runtime mismatch -- types and scheduling exist but execution is Google Meet-only
  - If we adopt Vexa/Attendee, this is solved automatically
  - If we stay custom, we need separate Playwright bots per platform (high effort)
- [ ] Evaluate desktop capture path -- market is moving beyond bot-only
  - Recall.ai offers a Desktop Recording SDK (invisible, no bot joins meeting)
  - No good OSS equivalent for desktop capture yet

### Capture Strategy — OSS Meeting Bots

| Project | Stars | License | Platforms | Verdict |
|---------|-------|---------|-----------|---------|
| Vexa | ~1,800 | Apache-2.0 | Meet, Zoom, Teams | **Pilot this** — most features, MCP server, permissive license |
| Attendee | ~522 | Open source | Meet, Zoom, Teams | Fallback — most mature (3,766 commits) |
| ScreenApp Bot | ~111 | MIT | Meet, Zoom, Teams | Skip — same Playwright fragility we already have |
| MeetingBot | ~252 | LGPL-3.0 | Meet, Zoom, Teams | Skip — LGPL restrictive, smaller community |

- [ ] Pilot Vexa (Apache-2.0) for Zoom + Teams support
- [ ] Fallback: Attendee if Vexa too rough

### Commercial APIs (only if enterprise demands it)

| Provider | Cost/hr | Platforms | Key Differentiator |
|----------|---------|-----------|-------------------|
| Skribby | $0.35 | Meet, Zoom, Teams | Cheapest, single REST endpoint |
| MeetingBaaS | $0.066 self-host | Meet, Zoom, Teams | Source-available, BSL license |
| Recall.ai | $0.50+$0.15 | 6 platforms | Market leader, SOC-2/HIPAA |

- [ ] Recall.ai for SOC-2/HIPAA or niche platforms — revisit only when someone asks

---

## Future — Self-Hosted Transcription

> Only relevant at 170+ hrs/month. Full hardware specs in `human-todos/ai-recording-todos.md`.

### Self-Hosted Transcription Engines

| Engine | Stars | Accuracy | Speed | GPU? | Speaker ID | Verdict |
|--------|-------|----------|-------|------|------------|---------|
| WhisperX | ~20,900 | ~7-8% WER | 70x realtime | Yes | Yes (pyannote) | **Use this** — all-in-one |
| faster-whisper | ~21,500 | ~7-8% WER | 4x Whisper | No (helps) | No | Good standalone, WhisperX wraps it |
| whisper.cpp | ~47,500 | ~7-8% WER | CPU-native | No | No | Edge/mobile only |
| Vosk | ~14,400 | 10-15% WER | Real-time | No | Basic | Too inaccurate |
| NVIDIA Parakeet | N/A | 1.8% WER | 2000x+ | Yes (NVIDIA) | No | Watch — best accuracy, early ecosystem |

### Speaker Identification Engines

| Tool | Stars | Error Rate (DER) | Verdict |
|------|-------|------------------|---------|
| pyannote.audio 4.0 | ~9,400 | 11-19% | Standard choice, MIT, bundled in WhisperX |
| NVIDIA NeMo | N/A | ~9% (2-speaker) | Better for 2-speaker, heavier setup |

### Hardware: Hetzner GEX44

| Spec | Value |
|------|-------|
| GPU | NVIDIA RTX 4000 SFF Ada, 20 GB VRAM |
| CPU | Intel i5-13500 (14 cores) |
| RAM | 64 GB DDR4 |
| Price | EUR 184/mo (~$200 USD), EUR 212.30/mo from April 2026 |
| Processing | ~3-6 min per hour of audio |
| Audio compat | WebM/Opus from our bot works directly, no conversion |
| VRAM peak | ~9.5 GB (pyannote 4.0 is the bottleneck, 20 GB is comfortable) |

- [ ] Self-host WhisperX when volume justifies ~$200/mo
- [ ] **Future:** WhisperX adds speaker ID to ALL transcripts regardless of provider

---

## Future — Agent Layer

- [ ] No agent-facing meeting layer -- MCP/agent access is becoming table stakes
  - Vexa already has an MCP server (another point in its favor)
- [ ] No enterprise-ready multi-platform capture yet

---

## Future — Benchmarks

- [ ] Run WhisperX on 3-5 real meeting recordings, compare accuracy to current providers
- [ ] Measure WhisperX GPU instance requirements (VRAM, CPU, latency per hour of audio)
- [ ] Test pyannote.audio speaker identification accuracy on our meeting audio
- [ ] Test Vexa locally — join a test Google Meet, verify audio capture and transcript quality

---

## Not Doing

### LiveKit

LiveKit is a real-time communication framework (SFU). It cannot join external meetings — Google Meet, Zoom, Teams don't expose WebRTC endpoints to third parties. Only relevant if we build our own video conferencing or need a real-time AI processing backbone. See ARCHITECTURE.md.

### Smart Routing by Context

Considered routing meetings to specific providers based on speaker count or audio quality (e.g. 2-speaker calls → Google Cloud STT). Rejected — can't reliably know speaker count or audio quality before meeting starts. Calendar attendees don't predict who joins. Audio quality detection requires processing first. The 3-tier rotation maximizes free usage automatically without user input.
