# Meetings Page - Current State

> **Route**: `/:slug/meetings`
> **Status**: 🟡 Functional baseline with route and deep-state screenshot coverage
> **Last Updated**: 2026-03-20


> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Current UI

- Page header with an "Open Calendar" escape hatch back to scheduling.
- Meeting memory rail across recent decisions, open questions, and unresolved follow-ups.
- Two-column workspace: recording list and filters on the left, detail view on the right.
- Schedule dialog for ad-hoc capture or calendar-linked recording setup.
- Empty state when no recordings exist yet.

---

## Screenshot Coverage

- `empty-meetings` captures the no-recordings state.
- `filled-meetings` captures the seeded workspace state under the canonical screenshot harness.
- `filled-meetings-detail` captures the alternate selected-recording detail state.
- `filled-meetings-transcript-search` captures transcript filtering on seeded content.
- `filled-meetings-memory-lens` captures the project-lens filtered memory rail.
- Meetings now use a dedicated readiness check in `e2e/screenshot-pages.ts` so captures wait for real page content instead of the app shell alone.

---

## Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/meetings.tsx` | Route wrapper and page header |
| `src/components/Meetings/MeetingsWorkspace.tsx` | Memory rail, filters, list, detail panel, scheduling |
| `e2e/screenshot-pages.ts` | Screenshot route coverage and readiness checks |

---

## Known Gaps

| Gap | Impact |
|-----|--------|
| Baseline screenshots not captured yet | Spec folder exists, but image baselines still need generation |
| Screenshot hashes not updated yet | New meetings capture states still need manifest approval |
| Visual review still pending | Captures need human review for composition and legibility across configs |
