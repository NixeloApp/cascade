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

### Platform Breadth

- [ ] Close the Zoom/Teams schema/runtime mismatch if we stay custom.
- [ ] Evaluate Vexa first for multi-platform capture.
- [ ] Keep Attendee as fallback if Vexa is too rough.
- [ ] Evaluate desktop capture only if the product direction still needs it.

### Collaboration / Product Cleanup

- [ ] Stop treating the stub `ConvexYjsProvider` as shipped collaboration.
- [ ] Decide how collaborative meeting notes should actually work before extending the surface further.

### Longer-Term Cost / Infra

- [ ] Decide expected monthly meeting volume.
- [ ] Revisit self-hosted WhisperX only if usage crosses the threshold where hosted APIs stop making sense.
