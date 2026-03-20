# Meetings Page - Current State

> **Route**: `/:slug/meetings`
> **Status**: 🟡 Functional baseline, now wired into screenshot coverage
> **Last Updated**: 2026-03-19

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
| No transcript/detail-focused subcaptures yet | Canonical route coverage exists, but deeper visual states are not isolated |
| No dedicated meetings E2E spec | Interaction regressions still rely on manual checks |

