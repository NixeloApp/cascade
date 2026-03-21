# Meeting Intelligence

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-21

### Screenshots & Visual QA

- [ ] Visual review of captured screenshots for quality (no spinners, real content)

### Document Editor Dependency (blocks meeting-to-doc)

- [ ] Clarify template/document seeding -- `createDocumentFromTemplate` returns `templateContent` but the Plate workflow has no clean e2e initialization
- [ ] Separate real collaboration from stubs -- `ConvexYjsProvider` is explicitly a stub, should not be treated as shipped

### Meeting-to-Doc Flow

- [ ] Add meeting-to-doc flow -- create or append a project document from meeting results

### Capture Strategy

- [ ] Document current runtime reality -- custom bot-service, Google Meet-first, richer backend than UI
- [ ] Choose whether capture stays custom or gets bought
- [ ] If staying custom, scope v1 honestly -- Google Meet-first until Zoom/Teams/desktop capture are deliberate

### Platform Breadth

- [ ] Close Zoom/Teams schema/runtime mismatch -- types and scheduling exist but execution is Google Meet-only
- [ ] Evaluate desktop capture path -- market is moving beyond bot-only

### Agent Layer

- [ ] No agent-facing meeting layer -- MCP/agent access is becoming common
- [ ] No enterprise-ready multi-platform capture yet

### OSS Evaluation (experiments, not critical path)

- [ ] Benchmark `faster-whisper` vs current provider
- [ ] Benchmark `WhisperX` for timestamps/diarization
- [ ] Benchmark `pyannote.audio` for speaker attribution
- [ ] Evaluate `whisper.cpp` for local/offline
- [ ] Study `LiveKit Agents` for future voice-agent features
