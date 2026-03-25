# Meeting Intelligence

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-25

Related docs:

- `docs/ai/voice/ARCHITECTURE.md`
- `human-todos/ai-recording-todos.md`

## Current State

- Google Meet-first capture exists with a richer backend than UI.
- Meeting detail now resolves transcript speakers and action-item owners against participant metadata, with speaker-attributed transcript turns and search that understands attendee emails.
- Meeting detail can now export a seeded document with meeting metadata, summary, action items, participants, and transcript context.
- The meetings route now has reviewed screenshots for canonical, detail, transcript search, memory lens, processing, filter-empty, and schedule-dialog states across desktop/tablet/mobile baselines.
- Provider rotation exists across recurring free tiers, one-time credit tiers, and paid fallback.
- Deepgram and AssemblyAI are integrated but still need real key setup and runtime verification.

## Remaining

### Product / Infra Follow-Up

- [ ] Stop treating the stub `ConvexYjsProvider` as shipped collaboration.

### Provider Rollout

- [ ] Add real `DEEPGRAM_API_KEY` and verify transcription end to end.
- [ ] Add real `ASSEMBLYAI_API_KEY` and verify transcription end to end.
- [ ] Run provider seed/update flow and confirm the rotation behaves as expected.

### Platform Breadth

- [ ] Close the Zoom/Teams schema/runtime mismatch if we stay custom.
- [ ] Evaluate Vexa first for multi-platform capture.
- [ ] Keep Attendee as fallback if Vexa is too rough.
- [ ] Evaluate desktop capture only if the product direction still needs it.

### Longer-Term Cost / Infra

- [ ] Decide expected monthly meeting volume.
- [ ] Revisit self-hosted WhisperX only if usage crosses the threshold where hosted APIs stop making sense.
