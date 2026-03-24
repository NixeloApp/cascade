# AI Recording: Self-Hosted Transcription (WhisperX on Hetzner)

> **Priority:** P1
> **Status:** Planning
> **Last Updated:** 2026-03-23
> **Context:** See `docs/ai/voice/ARCHITECTURE.md` for full build-vs-buy research

## Goal

Replace the 4 paid transcription providers (Speechmatics, Gladia, Azure, Google Cloud STT) with a self-hosted WhisperX instance on Hetzner (~$40-60/mo). Gets us unlimited transcription hours + speaker identification (who said what) on every transcript.

## Open Questions

- [ ] WhisperX service: own top-level directory (`transcription-service/`) or inside `bot-service/`?
- [ ] Keep paid providers as fallback if GPU box goes down, or rip them out?
- [ ] Hetzner GPU tier — A10G vs something smaller? Need to benchmark VRAM requirements for WhisperX large-v3

## Tasks

### 1. Design WhisperX service API
- Define endpoints (POST audio file → get transcript back)
- Request/response format (match existing `TranscriptionResult` interface)
- How it connects to bot-service (HTTP? same box? separate?)
- Health check endpoint

### 2. Write the WhisperX service
- Dockerfile (Python, CUDA, WhisperX + pyannote.audio dependencies)
- API server (FastAPI or Flask)
- WhisperX transcription pipeline: audio in → transcript + speaker labels + timestamps out
- Model preloading (large-v3 model loaded at startup, not per-request)
- HuggingFace token for pyannote model access

### 3. New transcription provider in bot-service
- `whisperx.ts` in `bot-service/src/services/transcription-providers/`
- Calls self-hosted WhisperX API
- Maps response to existing `TranscriptionResult` / `TranscriptSegment` interface
- Include speaker labels in `TranscriptSegment.speaker` field

### 4. Update provider priority
- WhisperX becomes primary (Priority 0)
- Paid providers become fallback (or get removed — decision pending)
- Update `index.ts` provider registry

### 5. Speaker labels through the stack
- Verify `TranscriptSegment.speaker` field flows to Convex `meetingTranscripts` table
- Update transcript UI to display speaker labels
- Update Claude summary prompt to leverage speaker names for better action item attribution ("Sarah volunteered to..." instead of "someone said...")

### 6. Hetzner deployment
- Rent GPU server (A10G or equivalent)
- Docker compose setup (WhisperX service + any dependencies)
- Systemd service or similar for auto-restart
- Firewall: only allow traffic from bot-service IP
- SSL/TLS for API endpoint
- Basic monitoring (health check, disk space for temp audio files)

### 7. Update docs
- `docs/ai/voice/SETUP.md` — add WhisperX setup section, Hetzner config
- `docs/ai/voice/ARCHITECTURE.md` — update diagram to show WhisperX as primary provider
- `todos/meeting-intelligence.md` — mark relevant items as done

## Not In Scope (for now)

- Replacing the Playwright bot with Vexa/Attendee (Phase 2, separate effort)
- Zoom/Teams support (depends on Phase 2)
- Desktop capture
- NVIDIA Parakeet/Canary (wait for ecosystem to mature)
