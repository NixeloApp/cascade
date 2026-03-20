# Meeting Intelligence / Read AI Feature Restart

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-19
> **Source:** Repo audit of current meeting bot implementation + March 2026 market refresh in `docs/research/competitors/meeting-ai/market-refresh-2026-03.md`

## High Priority

### First-Class Meetings Surface

The backend exists, but the feature is still mostly hidden inside the calendar event modal.

- [x] **Add a dedicated Meetings page** — Org-level route and sidebar entry for recordings, summaries, and action items.
- [x] **Keep calendar entry point** — Meetings should still be accessible from event details, but not only from there.
- [x] **Show all recording states in one place** — Scheduled, joining, recording, processing, completed, failed, cancelled.
- [x] **Add a useful empty state** — Explain what the feature does and how to start from calendar or direct meeting URL.

### Recording Detail Productization

The schema and Convex queries are richer than the current UI.

- [x] **Promote recording details into a real view** — Current experience now has a first-class detail surface in the Meetings workspace instead of only living inside the calendar modal.
- [x] **Expose participants** — Backend stores participants, but current UI does not show them in the main experience.
- [x] **Expose topics** — Backend stores topic summaries, but current UI ignores them.
- [x] **Expose open questions** — Summary schema supports them; current UI does not.
- [x] **Expose sentiment** — Summary schema supports it; current UI does not.
- [x] **Improve transcript UX** — Transcript detail now uses timestamped chunks with a raw-text fallback instead of a single unreadable block.
- [x] **Add transcript-level filtering** — Selected meetings now support local transcript segment filtering by phrase or speaker.
- [x] **Add transcript jump navigation** — Transcript detail now includes segment jump controls tied to the timestamped chunk view.

### Workflow Differentiation

This is the main Nixelo-specific opportunity versus Read AI / Fireflies / Otter.

- [x] **Expose action-item to issue creation in UI** — Convex supports `createIssueFromActionItem`, but it is not surfaced as a first-class frontend workflow.
- [x] **Show issue linkage state** — Linked issues now show issue key, title, and status directly in meeting results.
- [x] **Turn meetings into project artifacts** — Meetings now surface project context, linked-work counts, and direct project navigation instead of living as standalone notes.
- [ ] **Add meeting-to-doc flow** — Create or append a project document directly from meeting results when the document workflow is ready.

## Medium Priority

### Cross-Meeting Memory

The market has moved beyond single-meeting summaries.

- [x] **Add transcript search across meetings** — Use the existing transcript search index as the base.
- [x] **Add filters for platform / status / date / project** — Needed for a useful meetings archive.
- [x] **Add reusable memory views** — Recent decisions, open questions, and unresolved action items now surface across completed meetings.
- [ ] **Add meetings-by-project memory lens** — Group cross-meeting insights by project when the archive starts getting dense.

### Capture Strategy Clarity

The codebase and docs were out of sync before the March 2026 refresh.

- [ ] **Document current runtime reality in product docs** — Custom bot-service, Google Meet-first execution, richer backend than current UI.
- [ ] **Choose whether capture stays custom or gets bought** — Explicit decision needed instead of implicit drift.
- [ ] **If staying custom, scope v1 honestly** — Google Meet-first until Zoom / Teams / desktop capture are deliberate work items.

### Platform Breadth

- [ ] **Close schema/runtime mismatch** — Zoom and Teams exist in types and scheduling flow, but runtime execution is still effectively Google Meet-first.
- [ ] **Evaluate desktop capture path** — Market is moving beyond visible bot-only models.

## OSS Evaluation Track

These should be treated as experiments that support the product roadmap, not as the critical path.

- [ ] **Benchmark `faster-whisper`** — Compare quality/cost against current provider path.
- [ ] **Benchmark `WhisperX`** — Evaluate timestamps and diarization quality for better transcript UX.
- [ ] **Benchmark `pyannote.audio`** — Evaluate speaker attribution quality for participant-aware summaries.
- [ ] **Evaluate `whisper.cpp` for local/offline paths** — Only if lightweight or self-hosted deployment matters.
- [ ] **Study `LiveKit Agents` for future voice-agent features** — Useful for later interactive agent work, not for meeting joining itself.

## Explicit Gaps vs Current Market

- [x] **No first-class meetings hub** — Baseline meetings archive now exists in the sidebar; the remaining gap is deeper memory and workflow reuse.
- [x] **No cross-meeting memory product** — Baseline memory views now surface decisions, open questions, and unresolved follow-ups across meetings.
- [ ] **No agent-facing meeting layer** — MCP/agent access is becoming common in the category.
- [ ] **No desktop capture mode** — Bot-only capture is increasingly incomplete.
- [ ] **No enterprise-ready multi-platform capture story yet** — Current implementation is narrower than the market leaders.

## Non-Goals For First Pass

- [ ] **Do not rebuild the backend from scratch** — Existing scheduling, recording, transcript, summary, and participant foundations are worth keeping.
- [ ] **Do not chase every competitor feature immediately** — First fix discoverability, detail UX, workflow conversion, and transcript retrieval.

## Reference Files

### Existing implementation

- `src/components/MeetingRecordingSection.tsx`
- `src/components/Calendar/EventDetailsModal.tsx`
- `convex/meetingBot.ts`
- `convex/schema.ts`
- `bot-service/src/bot/manager.ts`
- `bot-service/src/bot/google-meet.ts`
- `bot-service/src/services/transcription.ts`
- `bot-service/src/services/summary.ts`

### Research

- `docs/research/competitors/meeting-ai/market-refresh-2026-03.md`
- `docs/research/comparisons/meeting-landscape.md`
- `docs/research/competitors/meeting-ai/read-ai.md`
