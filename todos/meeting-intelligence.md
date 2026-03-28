# Meeting Intelligence

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-26

Related docs:

- `docs/ai/voice/ARCHITECTURE.md`
- `human-todos/ai-recording-todos.md`

## Remaining

### Provider Rollout

- [ ] Add real `DEEPGRAM_API_KEY` and verify transcription end to end.
- [ ] Add real `ASSEMBLYAI_API_KEY` and verify transcription end to end.
- [ ] Run provider seed/update flow and confirm the rotation behaves as expected.

### Audio + Video Storage

Current bot captures audio only (WebM/Opus), saves to /tmp, never persists it. No video capture at all. Competitors keep both. See `docs/ai/voice/ARCHITECTURE.md` for full sizing and storage options.

- [ ] Add Cloudflare R2 (or similar) for persistent audio/video storage.
- [ ] Upload audio to R2 after transcription, store URL in `meetingRecordings.recordingUrl`.
- [ ] Delete temp files after successful upload.
- [ ] Add audio playback to meeting recording UI.
- [ ] Video capture requires Vexa/Attendee (our Playwright bot can't do it well).
- [ ] Add video playback to meeting recording UI once capture exists.

### Platform Breadth + Video Capture

Our Playwright bot only does Google Meet + audio only. Vexa/Attendee solve both problems at once (multi-platform + video capture).

- [ ] Evaluate Vexa first — gets us Zoom/Teams + video capture in one move.
- [ ] Keep Attendee as fallback if Vexa is too rough.
- [ ] Close the Zoom/Teams schema/runtime mismatch (solved automatically if we adopt Vexa/Attendee).
- [ ] Evaluate desktop capture only if the product direction still needs it.

### Collaboration / Product Cleanup

- [ ] Stop treating the stub `ConvexYjsProvider` as shipped collaboration.
- [ ] Decide how collaborative meeting notes should actually work before extending the surface further.

### Longer-Term Cost / Infra

- [ ] Decide expected monthly meeting volume.
- [ ] Revisit self-hosted WhisperX only if usage crosses the threshold where hosted APIs stop making sense.
