# Board Page - Current State

> **Route**: `/:slug/projects/:key/board`
> **Status**: 🟢 Trustworthy baseline
> **Last Updated**: 2026-03-21

---

## Screenshots

| Viewport | State | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |
| Desktop | Create Issue Modal | ![](screenshots/desktop-light-create-issue-modal.png) |
| Desktop | Import / Export Modal | ![](screenshots/desktop-light-import-export-modal.png) |
| Desktop | Import / Export Modal (Import JSON) | ![](screenshots/desktop-light-import-export-modal-import.png) |

---

## Current UI

- The board uses the slimmer shared project shell instead of the older heavy page chrome.
- Filled-state screenshots now show real seeded issues instead of broken empty baselines.
- Mobile now fits two real lanes comfortably instead of clipping the second lane immediately.
- The create-issue modal captures reliably again across the full screenshot matrix.
- The import/export modal now has first-class screenshot coverage for both the default export state and the import-state branch.
- The shared project shell and mobile tab row are tighter than the last round, so the board starts sooner and reads less like stacked chrome.
- The extra mobile board-actions card is gone; export/sprint controls now sit as a lighter utility row above filters instead of a full-width chrome block.
- Mobile filter controls now use the quieter shared filter button/input chrome instead of a heavier custom pill treatment.
- The mobile selection toggle now lives in a shared floating toolbar cluster, so it stops consuming a full row before the lanes begin.
- Mobile lanes now use a staged snap layout, so the first column owns the frame and the next lane peeks in deliberately.
- Mobile export and sprint controls now share that same floating cluster as selection, which removes the last detached board-only toolbar row before the lanes begin.
- The export action still uses compact mobile treatment, but it now rides inside the floating cluster instead of a separate strip.
- Import/export panel anatomy is now shared between export and import, and the import branch correctly swaps requirements and file validation by format.
- The board baseline is now operationally trustworthy, so the remaining issues are visual rather than harness-related.

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
| 2 | Desktop board chrome is cleaner than before, but the stacked shell/filter/toolbar layers are still a little busier than the issue content beneath them | shared board/page shell | LOW |

---

## Summary

The board screenshot baseline is trustworthy again. The next pass can stay focused on card hierarchy
and optional desktop polish, not import/export branch drift, harness repair, or mobile toolbar cleanup.
