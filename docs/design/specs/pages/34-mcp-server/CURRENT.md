# MCP Server Page - Current State

> **Route**: `/:slug/mcp-server`
> **Status**: STUB -- placeholder awaiting implementation
> **Last Updated**: 2026-03-22

---

## Purpose

Placeholder page for a future MCP (Model Context Protocol) server configuration interface.
Will allow users to connect external AI tools to their workspace data. Currently renders
a single EmptyState component with a "coming soon" message.

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppSidebar                    PageLayout                                    │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │ PageHeader  title="MCP Server"                                        │  │
│ ├─────────────────────────────────────────────────────────────────────────┤  │
│ │                                                                       │  │
│ │           ┌──────────────────────────────┐                             │  │
│ │           │  Server icon                 │                             │  │
│ │           │  "Configuration coming soon" │                             │  │
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
2. **PageHeader** -- renders "MCP Server" title. No description or actions.
3. **EmptyState** -- centered placeholder with `Server` icon, title, and a one-line description
   explaining that AI tools will be connectable through the Model Context Protocol.

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
| `src/routes/_auth/_app/$orgSlug/mcp-server.tsx` | Route definition (21 lines) |
| `src/components/layout/PageLayout.tsx` | Page shell |
| `src/components/ui/EmptyState.tsx` | EmptyState primitive |
