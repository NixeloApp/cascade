# Add-ons Page - Current State

> **Route**: `/:slug/add-ons`
> **Status**: STUB -- placeholder awaiting implementation
> **Last Updated**: 2026-03-22

---

## Purpose

Placeholder page for a future marketplace-style interface where users will browse and install
workspace add-ons (integrations, automations, etc.). Currently renders a single EmptyState
component with a "coming soon" message.

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppSidebar                    PageLayout                                    │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │ PageHeader  title="Add-ons"                                           │  │
│ ├─────────────────────────────────────────────────────────────────────────┤  │
│ │                                                                       │  │
│ │           ┌──────────────────────────────┐                             │  │
│ │           │  Puzzle icon                 │                             │  │
│ │           │  "Marketplace coming soon"   │                             │  │
│ │           │  description text            │                             │  │
│ │           └──────────────────────────────┘                             │  │
│ │                  EmptyState                                            │  │
│ │                                                                       │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Composition Walkthrough

1. **PageLayout** -- standard page shell, no `maxWidth` constraint.
2. **PageHeader** -- renders "Add-ons" title. No description or actions.
3. **EmptyState** -- centered placeholder with `Puzzle` icon, title, and a one-line description.

There is no data fetching, no state, and no interactive elements.

---

## Screenshot Matrix

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

---

## Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| -- | No problems -- page is a deliberate stub | -- | -- |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/add-ons.tsx` | Route definition (21 lines) |
| `src/components/layout/PageLayout.tsx` | Page shell |
| `src/components/ui/EmptyState.tsx` | EmptyState primitive |
