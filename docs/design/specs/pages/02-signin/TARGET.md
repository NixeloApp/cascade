# Sign In Page - Target State

> **Route**: `/signin`
> **Reference**: Mintlify auth pages
> **Goal**: Minimal, confident, premium

---

## Reference Screenshots (Mintlify)

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/reference-mintlify-desktop-dark.png) |
| Desktop | Light | ![](screenshots/reference-mintlify-desktop-light.png) |
| Mobile | Dark | ![](screenshots/reference-mintlify-mobile-dark.png) |

---

## Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     bg: bg-ui-bg (#08090a dark / white light)                              │
│                                                                             │
│     NO card. NO back link. Content floats.                                 │
│                                                                             │
│                                                                             │
│                                                                             │
│                              [N]                                            │
│                         (Logo, 32px)                                        │
│                                                                             │
│                                                                             │
│                       Sign in to Nixelo                                     │
│                       ─────────────────                                     │
│                    (24px, font-semibold, white)                            │
│                                                                             │
│                 Don't have an account? Sign up →                           │
│                    (14px, tertiary + brand link)                           │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ G  Continue with Google       │                        │
│                    └───────────────────────────────┘                        │
│                         (outlined, subtle border)                          │
│                                                                             │
│                    ──────────── or ────────────                            │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ ✉  Continue with email        │                        │
│                    └───────────────────────────────┘                        │
│                         (secondary variant)                                │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                    Terms of Service · Privacy Policy                       │
│                         (12px, tertiary, links)                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Card wrapper | Yes (`card-subtle`) | **NO** |
| Back link | Yes | **NO** |
| Logo size | 48px | 32px |
| Heading | "Welcome back" | "Sign in to Nixelo" |
| Subtitle | Separate line | Inline with signup link |
| Signup link | Below form | Below heading |
| Legal text | 3-line paragraph | Single line, bottom |
| Animations | 6 staggered | 1 fade-in |
| Max width | 448px (`max-w-md`) | 360px |

---

## Specifications

### Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MEASUREMENTS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Viewport ──────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │                        ↕ flexible (centers content)                  │   │
│  │                                                                      │   │
│  │  ┌─ Content Container (max-w-[360px] mx-auto) ──────────────────┐   │   │
│  │  │                                                               │   │   │
│  │  │  [Logo]                    32px height                        │   │   │
│  │  │      ↕ 32px (mt-8)                                            │   │   │
│  │  │  [Heading]                 30px line-height                   │   │   │
│  │  │      ↕ 8px (mt-2)                                             │   │   │
│  │  │  [Subtitle + link]         20px line-height                   │   │   │
│  │  │      ↕ 32px (mt-8)                                            │   │   │
│  │  │  [Google button]           48px height                        │   │   │
│  │  │      ↕ 16px (gap-4)                                           │   │   │
│  │  │  [Divider]                 20px height                        │   │   │
│  │  │      ↕ 16px (gap-4)                                           │   │   │
│  │  │  [Email button]            48px height                        │   │   │
│  │  │                                                               │   │   │
│  │  └───────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │                        ↕ flexible                                    │   │
│  │                                                                      │   │
│  │  ┌─ Legal (fixed bottom-8) ─────────────────────────────────────┐   │   │
│  │  │  Terms of Service · Privacy Policy                            │   │   │
│  │  └───────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Spacing

| Element | Value | Tailwind |
|---------|-------|----------|
| Page padding | 16px | `p-4` |
| Content max-width | 360px | `max-w-[360px]` |
| Logo → Heading | 32px | `mt-8` |
| Heading → Subtitle | 8px | `mt-2` |
| Subtitle → Form | 32px | `mt-8` |
| Form element gaps | 16px | `gap-4` |
| Legal from bottom | 32px | `bottom-8` |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Heading | 24px | 600 | `text-ui-text` |
| Subtitle | 14px | 400 | `text-ui-text-tertiary` |
| Signup link | 14px | 500 | `text-brand` |
| Button text | 14px | 500 | varies |
| Legal | 12px | 400 | `text-ui-text-tertiary` |

### Colors

| Element | Light | Dark | Token |
|---------|-------|------|-------|
| Background | #ffffff | #08090a | `bg-ui-bg` |
| Heading | gray-900 | #ffffff | `text-ui-text` |
| Subtitle | gray-400 | rgba(255,255,255,0.5) | `text-ui-text-tertiary` |
| Brand link | indigo-600 | indigo-400 | `text-brand` |
| Button border | gray-200 | rgba(255,255,255,0.07) | `border-ui-border` |

### Buttons

| Button | Height | Background | Border |
|--------|--------|------------|--------|
| Google | 48px | transparent | `border-ui-border` |
| Email | 48px | `bg-ui-bg-secondary` | none |
| Submit | 48px | `bg-brand` | none |

### Animation

**Single fade-in for entire content block:**

```css
@keyframes auth-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-content {
  animation: auth-enter 0.3s ease-out;
}
```

**NO staggered animations.**

---

## Form States

### Expanded (Email Form)

```
┌───────────────────────────────┐
│ ✉  email@example.com          │  ← Email input
└───────────────────────────────┘
     ↕ 12px
┌───────────────────────────────┐
│ ●●●●●●●●                      │  ← Password input
└───────────────────────────────┘
     ↕ 8px
                 Forgot password? →  ← Right aligned
     ↕ 16px
┌───────────────────────────────┐
│          Sign in              │  ← Primary button
└───────────────────────────────┘
```

### Input Fields

| Property | Value |
|----------|-------|
| Height | 48px |
| Border radius | 8px |
| Border | 1px `border-ui-border` |
| Focus border | `border-brand` |
| Focus ring | `ring-2 ring-brand/20` |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Desktop (1200px+) | Centered, 360px max |
| Tablet (768-1199px) | Same as desktop |
| Mobile (<768px) | Full width - 32px padding |

---

## Accessibility

### Color Contrast

| Element | Ratio | Pass |
|---------|-------|------|
| Heading (dark) | 21:1 | ✓ AAA |
| Subtitle (dark) | 7.5:1 | ✓ AAA |
| Brand link (dark) | 5.2:1 | ✓ AA |
| Button text | 8.1:1 | ✓ AAA |

### Focus Order

1. Logo (link)
2. "Sign up" link
3. Google button
4. Email button / inputs
5. Forgot password link
6. Submit button
7. Terms link
8. Privacy link
