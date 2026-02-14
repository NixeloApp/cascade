# Unsubscribe Page - Target State

> **Route**: `/unsubscribe/:token`
> **Reference**: Stripe, Linear unsubscribe flows
> **Goal**: Clean confirmation, one-click unsubscribe

---

## Design Principles

1. **One-click unsubscribe** - auto-processes on page load (keep this)
2. **No card wrapper** - content floats on background
3. **Minimal text** - user already knows what they're doing
4. **Clear confirmation** - show checkmark, done
5. **Way out** - always have a "Go to Home" or similar

---

## Structure

### Loading
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     bg: bg-ui-bg                                                           │
│                                                                             │
│                              [N]                                            │
│                         (Logo, 32px)                                        │
│                                                                             │
│                                                                             │
│                         [Spinner]                                           │
│                                                                             │
│                      Unsubscribing...                                       │
│                    (24px, font-semibold)                                   │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Success
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [N]                                            │
│                                                                             │
│                                                                             │
│                            ✓                                                │
│                    (checkmark icon, 32px, green)                           │
│                                                                             │
│                                                                             │
│                        Unsubscribed                                         │
│                       ─────────────────                                     │
│                    (24px, font-semibold)                                   │
│                                                                             │
│               You won't receive any more emails.                           │
│                    (14px, secondary)                                       │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │       Go to Home              │                        │
│                    └───────────────────────────────┘                        │
│                         (secondary)                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Invalid
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [N]                                            │
│                                                                             │
│                                                                             │
│                       Link expired                                          │
│                       ─────────────────                                     │
│                                                                             │
│               This unsubscribe link has expired.                           │
│               Sign in to manage your notifications.                        │
│                    (14px, secondary)                                       │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │       Sign in                 │                        │
│                    └───────────────────────────────┘                        │
│                         (primary)                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [N]                                            │
│                                                                             │
│                                                                             │
│                       Something went wrong                                  │
│                       ─────────────────                                     │
│                                                                             │
│               We couldn't process your request.                            │
│               Please try again later.                                      │
│                    (14px, secondary)                                       │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │       Go to Home              │                        │
│                    └───────────────────────────────┘                        │
│                         (secondary)                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Background | `bg-ui-bg-secondary` | `bg-ui-bg` |
| Card wrapper | Yes (`shadow-lg rounded-lg p-8`) | **NO** |
| Icons | 48px in colored circles | 32px, color only (no bg circle) |
| Icon implementation | Inline SVG | Icon component |
| Success text | 3 paragraphs | 1 sentence |
| Navigation | None | "Go to Home" button |
| Max width | 448px (`max-w-md`) | 360px |

---

## Specifications

### Layout

| Element | Value | Tailwind |
|---------|-------|----------|
| Page padding | 16px | `p-4` |
| Content max-width | 360px | `max-w-[360px]` |
| Logo → Icon/Spinner | 48px | `mt-12` |
| Icon → Heading | 24px | `mt-6` |
| Heading → Subtitle | 8px | `mt-2` |
| Subtitle → Button | 32px | `mt-8` |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Heading | 24px | 600 | `text-ui-text` |
| Subtitle | 14px | 400 | `text-ui-text-secondary` |

### Icons

| State | Icon | Color |
|-------|------|-------|
| Loading | LoadingSpinner | `text-brand` |
| Success | Check | `text-status-success` |
| Invalid | (none) | - |
| Error | (none) | - |

Note: No icon backgrounds/circles. Just the icon with color.

---

## Behavior

### Auto-Unsubscribe Flow

1. Page loads
2. `getUserFromToken` query runs
3. If valid, `unsubscribe` mutation fires automatically
4. Show success state
5. User can click "Go to Home"

This one-click behavior is correct per RFC 8058. Keep it.

---

## Accessibility

### Focus Order

1. Logo (link)
2. Action button

### Screen Reader

- Loading state: spinner has `aria-label="Unsubscribing"`
- Success: heading announces completion
- Icon has `aria-hidden="true"`
