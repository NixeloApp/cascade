# Assistant - Current State

> **Route**: `/:orgSlug/assistant`
> **Status**: REVIEWED, seeded, and screenshot-covered
> **Last Updated**: 2026-03-25

## Purpose

Workspace-level AI activity overview. The route shows real usage totals, provider and operation
breakdowns, a read-only workspace snapshot, and a recent conversation list. It no longer pretends
to be a persistent configuration screen.

## Route Anatomy

```text
AppSidebar / Org shell
└── PageLayout (maxWidth="xl")
    ├── PageHeader
    │   ├── title = "Assistant"
    │   ├── description = "Workspace-level AI usage..."
    │   └── pill badge = "Powered by AI"
    └── Tabs
        ├── Overview
        │   ├── AssistantStats (3 cards)
        │   ├── AssistantSnapshotCard
        │   └── OperationBreakdown
        │       ├── By Operation
        │       └── By Provider
        └── Conversations
            └── RecentChats
                ├── compact chat rows when seeded data exists
                └── embedded empty state when no chats exist
```

## Reviewed Screenshot Matrix

### Canonical overview

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Conversations tab

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark-conversations.png) |
| Desktop | Light | ![](screenshots/desktop-light-conversations.png) |
| Tablet | Light | ![](screenshots/tablet-light-conversations.png) |
| Mobile | Light | ![](screenshots/mobile-light-conversations.png) |

### No-activity overview

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark-overview-empty.png) |
| Desktop | Light | ![](screenshots/desktop-light-overview-empty.png) |
| Tablet | Light | ![](screenshots/tablet-light-overview-empty.png) |
| Mobile | Light | ![](screenshots/mobile-light-overview-empty.png) |

### Empty conversations

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark-conversations-empty.png) |
| Desktop | Light | ![](screenshots/desktop-light-conversations-empty.png) |
| Tablet | Light | ![](screenshots/tablet-light-conversations-empty.png) |
| Mobile | Light | ![](screenshots/mobile-light-conversations-empty.png) |

### Loading

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark-loading.png) |
| Desktop | Light | ![](screenshots/desktop-light-loading.png) |
| Tablet | Light | ![](screenshots/tablet-light-loading.png) |
| Mobile | Light | ![](screenshots/mobile-light-loading.png) |

## Current Behavior

1. `getUsageStats` drives the overview cards, provider split, operation split, and snapshot copy.
2. `getUserChats` drives the conversations tab.
3. The route is intentionally read-only. The fake toggle/config controls are gone.
4. When usage is empty, the overview keeps honest zero-value stats and swaps the lower section to a
   real no-activity empty state.
5. When conversations are empty, the tab keeps its shell and shows an embedded empty state instead
   of a blank card.
6. Screenshot runs seed deterministic usage and chat data, plus an E2E-only empty mode and loading
   override, so this spec is not relying on incidental history.

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | The route is now honest and reviewable, but it is still a summary surface only. There is no drill-in from this page into full assistant conversation detail. | product depth | LOW |
| 2 | Admin/configuration controls are intentionally absent after removing the fake UI. If real assistant settings return later, they should ship as real persisted workflows, not cosmetic toggles. | future scope | LOW |

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/assistant.tsx` | Route UI, loading shell, snapshot copy, overview/conversations tabs |
| `src/routes/_auth/_app/$orgSlug/__tests__/assistant.test.tsx` | Route behavior coverage |
| `src/lib/test-ids.ts` | Stable assistant route hooks |
| `e2e/pages/assistant.page.ts` | Assistant page object |
| `e2e/screenshot-lib/interactive-captures.ts` | Assistant screenshot states |
| `convex/e2e.ts` | Seeded assistant usage/chat state and E2E reset endpoint |

## Summary

The assistant route is no longer a stale fake-management page with a canonical-only screenshot. It
is now a real, seeded, reviewable workspace AI activity surface with honest empty/loading states and
full viewport-matrix coverage for both overview and conversations.
