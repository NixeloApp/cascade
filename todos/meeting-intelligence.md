# Meeting Intelligence

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-23

### Screenshots & Visual QA

- [ ] Visual review of captured screenshots for quality (no spinners, real content)

### Document Editor Dependency (blocks meeting-to-doc)

- [ ] Clarify template/document seeding -- `createDocumentFromTemplate` returns `templateContent` but the Plate workflow has no clean e2e initialization
- [ ] Separate real collaboration from stubs -- `ConvexYjsProvider` is explicitly a stub, should not be treated as shipped

### Meeting-to-Doc Flow

- [ ] Add meeting-to-doc flow -- create or append a project document from meeting results

### Capture Strategy

> Research completed 2026-03-23. See `docs/ai/voice/ARCHITECTURE.md` for full analysis.

- [x] Document current runtime reality -- custom bot-service, Google Meet-first, richer backend than UI
- [ ] **Decision needed:** choose capture path (see options below)

**Option A — Stay custom + self-host transcription (recommended Phase 1):**
- [ ] Deploy WhisperX (faster-whisper + pyannote.audio) on a GPU instance
- [ ] Replace 4 paid provider rotation with WhisperX — eliminates 22hr/month free-tier ceiling
- [ ] Speaker identification comes free with WhisperX (pyannote.audio bundled)
- [ ] Keep existing Playwright bot for Google Meet untouched
- [ ] Estimated cost: ~$50-150/month GPU instance for unlimited transcription

**Option B — Adopt OSS meeting bot for multi-platform (recommended Phase 2):**
- [ ] Pilot Vexa (Apache-2.0, ~1,800 stars) in parallel with our Playwright bot for 2-4 weeks
  - All 3 platforms (Meet, Zoom, Teams)
  - Built-in Whisper transcription + real-time WebSocket streaming
  - MCP server for AI agents (aligns with agent-layer roadmap)
  - Self-hosted, no license restrictions
- [ ] Fallback: Attendee (~522 stars, 3,766 commits, 30 contributors) if Vexa is too rough
  - Django app, single Docker image, more battle-tested
  - Per-participant audio streams
- [ ] If OSS bots work → retire our custom Playwright bot

**Option C — Buy commercial API (only if enterprise demands it):**
- Skribby: $0.35/hr, cheapest, single REST endpoint, 10+ transcription models
- MeetingBaaS: $0.066/hr self-hosted (BSL license), source-available
- Recall.ai: $0.50+$0.15/hr, market leader, 6 platforms, SOC-2/HIPAA
- [ ] Revisit only if enterprise customers demand compliance certs or niche platforms (Webex/Slack/GoTo)

### Platform Breadth

- [ ] Close Zoom/Teams schema/runtime mismatch -- types and scheduling exist but execution is Google Meet-only
  - If we adopt Vexa/Attendee, this is solved automatically
  - If we stay custom, we need separate Playwright bots per platform (high effort)
- [ ] Evaluate desktop capture path -- market is moving beyond bot-only
  - Recall.ai offers a Desktop Recording SDK (invisible, no bot joins meeting)
  - No good OSS equivalent for desktop capture yet

### Speaker Identification (currently missing)

> Transcripts today are a wall of text with no way to tell who said what. Only Gladia and Google Cloud STT return partial speaker data. This makes summaries and action items less useful.

- [ ] **Phase 1 fix:** WhisperX self-hosted adds pyannote.audio speaker identification to all transcripts
- [ ] **Quick fix (if WhisperX is delayed):** Enable Speechmatics speaker identification in our existing code (it supports it, we just didn't turn it on)
- [ ] Update transcript UI to show speaker labels
- [ ] Update summary prompt to use speaker names for action item attribution

### Agent Layer

- [ ] No agent-facing meeting layer -- MCP/agent access is becoming table stakes
  - Vexa already has an MCP server (another point in its favor)
- [ ] No enterprise-ready multi-platform capture yet

### OSS Evaluation (research done, benchmarks pending)

> Research completed 2026-03-23. Full findings in `docs/ai/voice/ARCHITECTURE.md`.

**Transcription engines researched:**

| Engine | Stars | Accuracy | Speed | GPU? | Speaker ID | Verdict |
|--------|-------|----------|-------|------|------------|---------|
| WhisperX | ~20,900 | ~7-8% WER | 70x realtime | Yes | Yes (pyannote) | **Use this** — all-in-one |
| faster-whisper | ~21,500 | ~7-8% WER | 4x Whisper | No (helps) | No | Good standalone, WhisperX wraps it |
| whisper.cpp | ~47,500 | ~7-8% WER | CPU-native | No | No | Edge/mobile only |
| Vosk | ~14,400 | 10-15% WER | Real-time | No | Basic | Too inaccurate |
| NVIDIA Parakeet | N/A | 1.8% WER | 2000x+ | Yes (NVIDIA) | No | Watch — best accuracy, early ecosystem |

**Meeting bot frameworks researched:**

| Project | Stars | License | Platforms | Verdict |
|---------|-------|---------|-----------|---------|
| Vexa | ~1,800 | Apache-2.0 | Meet, Zoom, Teams | **Pilot this** — most features, MCP server, permissive license |
| Attendee | ~522 | Open source | Meet, Zoom, Teams | Fallback — most mature (3,766 commits) |
| ScreenApp Bot | ~111 | MIT | Meet, Zoom, Teams | Skip — same Playwright fragility we already have |
| MeetingBot | ~252 | LGPL-3.0 | Meet, Zoom, Teams | Skip — LGPL restrictive, smaller community |

**Speaker identification:**
- pyannote.audio 4.0 (~9,400 stars, MIT) — standard choice, bundled in WhisperX
- NVIDIA NeMo — better for 2-speaker scenarios, heavier setup

**Remaining benchmarks:**
- [ ] Run WhisperX on 3-5 real meeting recordings, compare accuracy to current providers
- [ ] Measure WhisperX GPU instance requirements (VRAM, CPU, latency per hour of audio)
- [ ] Test pyannote.audio speaker identification accuracy on our meeting audio
- [ ] Test Vexa locally — join a test Google Meet, verify audio capture and transcript quality

### LiveKit (not applicable for now)

> LiveKit is a real-time communication framework (SFU). It cannot join external meetings (Google Meet, Zoom, Teams don't expose WebRTC endpoints to third parties). Only relevant if we build our own video conferencing or need a real-time AI processing backbone. See ARCHITECTURE.md for details.
