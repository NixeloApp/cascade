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
- [x] Research build-vs-buy options (completed 2026-03-23)
- [ ] **Decision needed:** what's our expected monthly meeting volume? This determines the path:

| Monthly Hours | Best Path | Cost/mo |
|---------------|-----------|---------|
| <50 hrs | Stay current (free tiers) | $0 |
| 50-170 hrs | Skribby API ($0.35/hr) | $18-60 |
| 170+ hrs | Self-host WhisperX on Hetzner GEX44 | ~$200 flat |

> Detailed task breakdown in `human-todos/ai-recording-todos.md`

**Phase 1A — Skribby (if <170 hrs/month):**
- [ ] Add Skribby as a transcription provider ($0.35/hr, includes speaker ID, no infra)

**Phase 1B — Self-host WhisperX (if 170+ hrs/month):**
- [ ] Rent Hetzner GEX44 (RTX 4000 SFF Ada, 20 GB VRAM, ~$200/mo)
- [ ] Build + deploy WhisperX service (Python/FastAPI, CUDA 12.8)
- [ ] Add WhisperX as primary transcription provider

**Phase 2 — Multi-platform (after Phase 1):**
- [ ] Pilot Vexa (Apache-2.0) for Zoom + Teams support
- [ ] Fallback: Attendee if Vexa is too rough

**Phase 3 — Buy premium (only if enterprise demands it):**
- [ ] Recall.ai for SOC-2/HIPAA or niche platforms — revisit only when someone asks

### Platform Breadth

- [ ] Close Zoom/Teams schema/runtime mismatch -- types and scheduling exist but execution is Google Meet-only
  - If we adopt Vexa/Attendee, this is solved automatically
  - If we stay custom, we need separate Playwright bots per platform (high effort)
- [ ] Evaluate desktop capture path -- market is moving beyond bot-only
  - Recall.ai offers a Desktop Recording SDK (invisible, no bot joins meeting)
  - No good OSS equivalent for desktop capture yet

### Speaker Identification (partially addressed)

> Deepgram and AssemblyAI (tier 2 providers, now integrated) both return speaker labels. Gladia and Google Cloud STT (tier 1) also return partial speaker data. Speechmatics and Azure do not.

- [x] Add providers with speaker identification (Deepgram, AssemblyAI)
- [ ] Enable Speechmatics speaker identification in our existing code (it supports it, we just didn't turn it on)
- [ ] Update transcript UI to show speaker labels
- [ ] Update summary prompt to use speaker names for action item attribution
- [ ] **Future:** WhisperX self-hosted adds speaker ID to ALL transcripts regardless of provider

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
