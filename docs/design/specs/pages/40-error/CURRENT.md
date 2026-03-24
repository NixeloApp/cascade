# Error Page - Current State

> **Component**: `src/components/ErrorBoundary.tsx`
> **Status**: IMPLEMENTED -- functional error boundary wrapping the app
> **Last Updated**: 2026-03-22

---

## Purpose

React class-based error boundary that catches uncaught render-time errors
anywhere in the component tree and displays a recovery UI instead of
crashing to a blank screen. Supports an optional custom fallback and an
`onError` callback for external error reporting.

---

## Component Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Flex  (full screen, centered, bg-ui-bg, animate-fade-in)                   │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐   │
│   │ Card  (variant="flat", padding="lg", max-w-md, text-center)        │   │
│   │                                                                     │   │
│   │   ┌─────────┐                                                       │   │
│   │   │  /!\    │  IconCircle (size="xl", variant="error")              │   │
│   │   │ Alert   │  AlertTriangle icon (size-10, text-status-error)      │   │
│   │   └─────────┘                                                       │   │
│   │                                                                     │   │
│   │   500                                                                │   │
│   │   Typography (variant="errorCodeDisplay")                           │   │
│   │                                                                     │   │
│   │   Something went wrong                                               │   │
│   │   Typography (variant="large", color="secondary")                   │   │
│   │                                                                     │   │
│   │   We encountered an unexpected error.                                │   │
│   │   Please try refreshing the page.                                    │   │
│   │   Typography (color="tertiary")                                     │   │
│   │                                                                     │   │
│   │   > View error details            (collapsible <details>)           │   │
│   │     ┌────────────────────────────────────────────────────────┐       │   │
│   │     │ error.message                                          │       │   │
│   │     │ (pre, mono, bg-ui-bg-soft, max-h-40, overflow-auto)  │       │   │
│   │     └────────────────────────────────────────────────────────┘       │   │
│   │                                                                     │   │
│   │   [ Reload page ]                                                   │   │
│   │   Button (size="lg", calls window.location.reload())               │   │
│   │                                                                     │   │
│   └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Composition Walkthrough

1. **ErrorBoundary** is a React class component (required for `componentDidCatch`).
2. In normal operation (`hasError === false`), it transparently renders `this.props.children`.
3. When an error is caught:
   - `getDerivedStateFromError` sets `hasError: true` and stores the `error` object.
   - `componentDidCatch` logs to console and calls the optional `onError` prop.
   - If a custom `fallback` prop is provided, it renders that instead of the default UI.
   - Default fallback:
     - Full-screen centered `Flex` with fade-in animation.
     - `Card` (flat variant, lg padding) containing a vertical `Stack`:
       - `IconCircle` (xl, error) with `AlertTriangle` icon.
       - Large "500" text using `errorCodeDisplay` typography variant.
       - "Something went wrong" heading.
       - Instructional text.
       - Collapsible `<details>` with error message in a monospace pre block
         (max-height 40, scrollable).
       - "Reload page" `Button` (size lg) that calls `window.location.reload()`.

---

## States

| State | Behavior |
|-------|----------|
| No error | Renders children transparently (invisible wrapper) |
| Error caught, no fallback prop | Renders the default 500 card described above |
| Error caught, fallback prop provided | Renders the custom fallback `ReactNode` |

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
| ~~1~~ | ~~No navigation option~~ **Fixed** — added "Go to dashboard" button alongside "Try again" | ~~`ErrorBoundary`~~ | ~~LOW~~ |
| 2 | No external error reporting integration (Sentry, PostHog) -- only console.error | `componentDidCatch` | MEDIUM |
| ~~3~~ | ~~Error details only show error.message~~ **Fixed** — now shows component stack trace in expandable details | ~~`<details>` block~~ | ~~LOW~~ |
| ~~4~~ | ~~No recovery without full page reload~~ **Fixed** — "Try again" button resets error state and re-mounts children | ~~`ErrorBoundary`~~ | ~~LOW~~ |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/components/ErrorBoundary.tsx` | Error boundary component (109 lines) |
| `src/routes/__root.tsx` | Wraps the app outlet in `<ErrorBoundary>` |
| `src/components/ui/Card.tsx` | Card primitive (flat variant) |
| `src/components/ui/IconCircle.tsx` | Circular icon container (error variant) |
| `src/components/ui/Typography.tsx` | Typography variants (errorCodeDisplay, large) |
| `src/components/ui/Button.tsx` | Reload button |
| `src/components/ui/Stack.tsx` | Vertical layout |
| `src/components/ui/Flex.tsx` | Centering layout |
