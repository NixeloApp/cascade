# AI Assistant Page - Current State

> **Route**: `/:slug/assistant`
> **Status**: IMPLEMENTED -- static UI with hardcoded data, no backend wiring
> **Last Updated**: 2026-03-22

---

## Purpose

Management interface for the workspace AI assistant. Displays usage statistics
(spend, questions answered, success rate), a configuration form (system prompt,
model selection, support email, help button toggle), and a billing/upgrade tab.
All data is currently hardcoded -- there is no backend integration.

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppSidebar                    PageLayout (maxWidth="xl")                    │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │ PageHeader  title="Assistant"                                         │  │
│ │             description="Manage your AI assistant..."                 │  │
│ ├─────────────────────────────────────────────────────────────────────────┤  │
│ │                                                                       │  │
│ │  AssistantStats (3-column Grid)                                       │  │
│ │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                   │  │
│ │  │ Spend        │ │ Questions    │ │ Answered     │                   │  │
│ │  │ $42.50 +12%  │ │ 1,240  +5%  │ │ 1,180  95%   │                   │  │
│ │  │ Card w/ left │ │              │ │ Success Rate │                   │  │
│ │  │ green border │ │              │ │              │                   │  │
│ │  └──────────────┘ └──────────────┘ └──────────────┘                   │  │
│ │                                                                       │  │
│ │  AssistantConfig (Tabs)                                               │  │
│ │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│ │  │ [General]  [Billing]                                            │  │  │
│ │  ├──────────────────────────────────────────────────────────────────┤  │  │
│ │  │                                                                 │  │  │
│ │  │  General tab:                                                   │  │  │
│ │  │   StatusCard  Bot icon + Switch (enabled/disabled)              │  │  │
│ │  │   ConfigCard  System Prompt textarea                            │  │  │
│ │  │               Model select | Support Email input                │  │  │
│ │  │               Show Help Button toggle                           │  │  │
│ │  │                                                                 │  │  │
│ │  │  Billing tab:                                                   │  │  │
│ │  │   Upgrade to Pro banner (brandSolid CTA)                        │  │  │
│ │  │   Usage chart placeholder (dashed-border empty box)             │  │  │
│ │  │                                                                 │  │  │
│ │  └──────────────────────────────────────────────────────────────────┘  │  │
│ │                                                                       │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Composition Walkthrough

1. **PageLayout** with `maxWidth="xl"` constrains content width.
2. **PageHeader** renders title and a short description.
3. **AssistantStats** renders a 3-column responsive `Grid` of metric `Card`s.
   Each card has a green left-border accent (`bg-status-success`), an icon, a large
   value, and a trend `Badge`. Data is hardcoded inline.
4. **AssistantConfig** renders a `Tabs` component with two tabs:
   - **General tab**:
     - Status card with `IconCircle` (success/muted), description, and a `Switch` toggle.
     - Configuration card with `Textarea` (system prompt), `Select` (model), `Input`
       (support email), and a `Switch` (help button toggle). Disabled when assistant
       is toggled off (opacity + pointer-events-none).
   - **Billing tab**:
     - Upgrade-to-Pro banner card with `IconCircle` (brand), description, and
       `Button` (brandSolid).
     - Usage card with a dashed-border placeholder div where a chart will go.

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
| 1 | All stats are hardcoded -- no backend queries power this page | `AssistantStats`, `AssistantConfig` | HIGH |
| 2 | Model list includes both OpenAI and Anthropic models but no actual API integration | `AssistantConfig` | HIGH |
| 3 | Billing tab "Upgrade Plan" button has no handler | `AssistantConfig` | MEDIUM |
| 4 | Usage chart is a dashed placeholder box with no charting library | `AssistantConfig` | MEDIUM |
| 5 | Config form changes are client-only `useState` -- nothing persists | `AssistantConfig` | HIGH |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/assistant.tsx` | Route + all components (277 lines) |
| `src/components/layout/PageLayout.tsx` | Page shell |
| `src/components/ui/Card.tsx` | Card primitives |
| `src/components/ui/Tabs.tsx` | Tab primitives |
| `src/components/ui/Select.tsx` | Select dropdown |
| `src/components/ui/Switch.tsx` | Toggle switch |
| `src/components/ui/Textarea.tsx` | Textarea input |
| `src/components/ui/Badge.tsx` | Trend badges |
| `src/components/ui/Dot.tsx` | Pulsing status dot |
| `src/components/ui/IconCircle.tsx` | Circular icon wrapper |
