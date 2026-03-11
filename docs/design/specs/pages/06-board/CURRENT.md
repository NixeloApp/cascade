# Board Page - Current State

> **Route**: `/:slug/projects/:key/board`
> **Status**: 🔴 Functional capture, weak chrome discipline
> **Last Updated**: 2026-03-11

---

## Screenshots

| Viewport | State | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |
| Desktop | Create Issue Modal | ![](screenshots/desktop-light-create-issue-modal.png) |

---

## Structure

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ AppHeader                                                                                    │
│ [menu] [workspace cockpit]                      [ ? ] [timer] [search] [notifications] [me] │
│                                                ^ overpacked right cluster inside one pill    │
│                                                ^ controls look like they float over each     │
│                                                  other instead of being intentionally staged  │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Project shell                                                                                │
│ [project identity]                                                                           │
│ [board][backlog][inbox][roadmap][calendar][more...]                                          │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Board page header / mobile actions                                                           │
│ [delivery board copy] [badges] [export] [sprint selector]                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Filter bar                                                                                   │
│ [search][type][priority][assignee][labels][dates][clear][save]                               │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Board toolbar                                                                                │
│ [board title]                                                   [selection toggle]           │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Columns                                                                                      │
│ [To Do] [In Progress] [In Review] [Done]                                                     │
│ cards                                                                                        │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Current UI

- The board uses the slimmer shared project shell instead of the older heavy page chrome.
- Filled-state screenshots now show real seeded issues instead of broken empty baselines.
- Mobile surfaces actual board content on the first screen.
- The create-issue modal captures reliably again.

The state is better operationally, but the chrome now has a new problem: several shared surfaces
are technically working while still looking compositionally wrong.

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

---

## Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | The app-header action pill is overstuffed; shortcuts, timer, search, notifications, and user menu read like loose controls floating in one shared blob | `AppHeader.tsx` | HIGH |
| 2 | Screenshot capture succeeded, but visual review still missed an obvious header composition failure | review process | HIGH |
| 3 | Search/commands, advanced search, and keyboard shortcuts do not share one coherent modal anatomy | shared dialogs | HIGH |
| 4 | Some modal bodies contain more content than their frame comfortably holds, but scrolling behavior and footer treatment are inconsistent | `GlobalSearch.tsx`, `AdvancedSearchModal.tsx`, `KeyboardShortcutsHelp.tsx`, `Dialog.tsx` | HIGH |
| 5 | Mobile and desktop project chrome are slimmer than before, but not yet rhythmically aligned | shared shell | MEDIUM |
| 6 | Board lanes/cards are cleaner, but the surrounding chrome still competes with the actual work surface | page composition | MEDIUM |

---

## Review Notes

- Screenshot readiness is necessary, not sufficient.
- This page now proves the current gap clearly:
  - harness/data correctness is better
  - design review quality is still not disciplined enough
- The next board pass should fix the shared header and modal system before doing more local board polish.

---

## Summary

The board is no longer failing because of bad seeded data. It is failing because shared chrome and
overlay anatomy are inconsistent, crowded, and visually under-directed.
