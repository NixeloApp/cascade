# Board Page - Current State

> **Route**: `/:slug/projects/:key/board`
> **Status**: REVIEWED, trustworthy baseline
> **Last Updated**: 2026-03-25


> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Screenshot Matrix

| Viewport | State | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |
| Desktop | Create Issue Modal | ![](screenshots/desktop-light-create-issue-modal.png) |

---

## Current UI

- The board uses the slimmer shared project shell instead of the older heavy page chrome.
- Filled-state screenshots now show real seeded issues instead of broken empty baselines.
- Mobile now fits two real lanes comfortably instead of clipping the second lane immediately.
- The create-issue modal captures reliably again across the full screenshot matrix.
- The shared project shell is lighter now: the bespoke header card is gone, the project identity lives in the shared `PageHeader`, and desktop tabs use a slimmer section strip instead of a second pill panel.
- The shared project shell and mobile tab row are tighter than the last round, so the board starts sooner and reads less like stacked chrome.
- The extra mobile board-actions card is gone; export/sprint controls now sit as a lighter utility row above filters instead of a full-width chrome block.
- Mobile filter controls now use the quieter shared filter button/input chrome instead of a heavier custom pill treatment.
- The mobile selection toggle now lives in a shared floating toolbar cluster, so it stops consuming a full row before the lanes begin.
- Mobile lanes now use a staged snap layout, so the first column owns the frame and the next lane peeks in deliberately.
- Mobile export and sprint controls now share that same floating cluster as selection, which removes the last detached board-only toolbar row before the lanes begin.
- The export action still uses compact mobile treatment, but it now rides inside the floating cluster instead of a separate strip.
- The board baseline is now operationally trustworthy, so the remaining issues are visual rather than harness-related.
- The screenshot matrix also includes create-issue validation/success/draft-restore, filter-active, swimlane, import/export, collapsed-column, and WIP warning states in the spec folder beyond the single modal preview shown above.

---

## Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/projects/$key/route.tsx` | Shared project shell |
| `src/routes/_auth/_app/$orgSlug/projects/$key/board.tsx` | Board page chrome |
| `src/components/App/AppHeader.tsx` | Global app header |
| `src/components/GlobalSearch.tsx` | Search and commands modal + trigger |
| `src/components/KeyboardShortcutsHelp.tsx` | Shortcuts modal |
| `src/components/AdvancedSearchModal.tsx` | Advanced search modal |
| `src/components/FilterBar.tsx` | Filters |
| `src/components/Kanban/BoardToolbar.tsx` | Board toolbar |
| `src/components/KanbanBoard.tsx` | Board columns |
| `src/components/Kanban/KanbanColumn.tsx` | Column shell |
| `src/components/IssueCard.tsx` | Issue cards |
| `e2e/screenshot-pages.ts` | Screenshot readiness for board/backlog/modal capture |
| `e2e/pages/projects.page.ts` | Shared create-issue modal readiness contract |

---

## Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | Card hierarchy inside the first lane could still feel a little stronger in light mode | `src/components/Kanban/KanbanColumn.tsx`, `src/components/IssueDetail/IssueCard.tsx` | LOW |

---

## Summary

The board screenshot baseline is trustworthy again. The next pass can stay focused on card hierarchy
and lane-level polish, not shared-shell cleanup, harness repair, or mobile toolbar cleanup.
