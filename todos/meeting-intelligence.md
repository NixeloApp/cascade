# Meeting Intelligence

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-20

## Shipped

First-class Meetings workspace, recording detail view, participant/topic/sentiment display, transcript UX with search/jump, action-item to issue creation, cross-meeting memory rail with project lens, and transcript filtering are all shipped.

## Remaining Work

### Screenshots & Visual QA

- [x] Add spec folder `docs/design/specs/pages/30-meetings/` with page docs
- [x] Add meetings page to `e2e/screenshot-pages.ts` capture specs (empty state + seeded workspace route coverage)
- [x] Expand meetings screenshot coverage with detail/transcript-focused captures if the base route shot is not sufficient
- [x] Capture baselines across all 4 viewport/theme combos (desktop-dark, desktop-light, tablet-light, mobile-light)
- [x] Update `.screenshot-hashes.json` manifest with new captures
- [ ] Visual review of captured screenshots for quality (no spinners, real content)

### E2E Tests

- [x] Add meetings page to page objects (`e2e/pages/`)
- [x] Add `e2e/meetings.spec.ts` covering: empty state, recording list/detail, transcript search, and memory rail filtering
- [x] Extend meetings E2E coverage to action-item to issue creation

### MeetingsWorkspace Code Quality

- [x] Fix 55 validator violations in `MeetingsWorkspace.tsx` (7 standards, 30 raw TW, 2 surface shells, 16 layout prop)
- [x] Fix type errors in `MeetingsWorkspace.test.tsx` (summary nullability, mock shapes)
- [x] Replace raw HTML/Tailwind patterns with design system components (Flex, Typography, Card, etc.)

### Document Editor Dependency (blocks meeting-to-doc)

- [ ] Wire Plate editor to an explicit save/sync path -- the frontend save wiring to `api.prosemirror.*` is not closed
- [ ] Clarify template/document seeding -- `createDocumentFromTemplate` returns `templateContent` but the Plate workflow has no clean e2e initialization
- [ ] Separate real collaboration from stubs -- `ConvexYjsProvider` is explicitly a stub, should not be treated as shipped

### Meeting-to-Doc Flow

- [ ] Add meeting-to-doc flow -- create or append a project document from meeting results (blocked on editor persistence)

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
