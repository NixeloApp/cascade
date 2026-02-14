# Forgot Password Page - Target State

> **Route**: `/forgot-password`
> **Reference**: Mintlify auth pages
> **Goal**: Minimal, confident, premium (mirrors signin/signup)

---

## Reference Screenshots (Mintlify)

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/reference-mintlify-desktop-dark.png) |
| Desktop | Light | ![](screenshots/reference-mintlify-desktop-light.png) |

---

## Structure

### Step 1: Email Entry

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
│                       Reset your password                                   │
│                       ───────────────────                                   │
│                    (24px, font-semibold, white)                            │
│                                                                             │
│                    Remember your password? Sign in →                       │
│                    (14px, tertiary + brand link)                           │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ ✉  Email                      │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │       Send reset code         │                        │
│                    └───────────────────────────────┘                        │
│                         (primary variant)                                  │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                    Terms of Service · Privacy Policy                       │
│                         (12px, tertiary, links)                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Code Entry + New Password

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     bg: bg-ui-bg (#08090a dark / white light)                              │
│                                                                             │
│                                                                             │
│                                                                             │
│                              [N]                                            │
│                         (Logo, 32px)                                        │
│                                                                             │
│                                                                             │
│                       Check your email                                      │
│                       ────────────────                                      │
│                    (24px, font-semibold, white)                            │
│                                                                             │
│                    We sent a code to user@example.com                       │
│                    (14px, tertiary)                                         │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │  8-digit code                 │                        │
│                    └───────────────────────────────┘                        │
│                         ↕ 12px                                              │
│                    ┌───────────────────────────────┐                        │
│                    │  New password                 │                        │
│                    └───────────────────────────────┘                        │
│                         ↕ 4px                                               │
│                    Must be at least 8 characters                            │
│                         ↕ 16px                                              │
│                    ┌───────────────────────────────┐                        │
│                    │       Reset password          │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                    Didn't receive? Try again                                │
│                    (12px, tertiary + brand link)                           │
│                                                                             │
│                                                                             │
│                    Terms of Service · Privacy Policy                       │
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
| Heading (step 1) | "Forgot password?" | "Reset your password" |
| Subtitle | Generic | Inline with signin link |
| Signin link | Below form | Below heading |
| Heading (step 2) | "Reset password" | "Check your email" |
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
│  │  │  [Email input]             48px height                        │   │   │
│  │  │      ↕ 16px (gap-4)                                           │   │   │
│  │  │  [Submit button]           48px height                        │   │   │
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
| Email → Button | 16px | `gap-4` |
| Code → Password | 12px | `gap-3` |
| Password → Hint | 4px | `-mt-2` |
| Legal from bottom | 32px | `bottom-8` |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Heading | 24px | 600 | `text-ui-text` |
| Subtitle | 14px | 400 | `text-ui-text-tertiary` |
| Signin link | 14px | 500 | `text-brand` |
| Button text | 14px | 500 | varies |
| Password hint | 12px | 400 | `text-ui-text-tertiary` |
| Retry link | 12px | 400 | `text-ui-text-tertiary` |
| Legal | 12px | 400 | `text-ui-text-tertiary` |

### Colors

| Element | Light | Dark | Token |
|---------|-------|------|-------|
| Background | #ffffff | #08090a | `bg-ui-bg` |
| Heading | gray-900 | #ffffff | `text-ui-text` |
| Subtitle | gray-400 | rgba(255,255,255,0.5) | `text-ui-text-tertiary` |
| Brand link | indigo-600 | indigo-400 | `text-brand` |
| Button bg | indigo-600 | indigo-500 | `bg-brand` |
| Input border | gray-200 | rgba(255,255,255,0.07) | `border-ui-border` |

### Buttons

| Button | Height | Background | Border |
|--------|--------|------------|--------|
| Send reset code | 48px | `bg-brand` | none |
| Reset password | 48px | `bg-brand` | none |

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

## Form Fields

### Email Input (Step 1)

| Property | Value |
|----------|-------|
| Height | 48px |
| Border radius | 8px |
| Border | 1px `border-ui-border` |
| Placeholder | "Email" |
| Focus border | `border-brand` |
| Focus ring | `ring-2 ring-brand/20` |

### Code Input (Step 2)

| Property | Value |
|----------|-------|
| Height | 48px |
| Placeholder | "8-digit code" |
| Pattern | `[0-9]{8}` |
| Input mode | `numeric` |

### New Password Input (Step 2)

| Property | Value |
|----------|-------|
| Height | 48px |
| Placeholder | "New password" |
| Min length | 8 |
| aria-describedby | "password-hint" |

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

### Focus Order (Step 1)

1. Logo (link)
2. "Sign in" link
3. Email input
4. Submit button
5. Terms link
6. Privacy link

### Focus Order (Step 2)

1. Logo (link)
2. Code input
3. Password input
4. Submit button
5. "Try again" link
6. Terms link
7. Privacy link
