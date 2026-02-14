# Verify Email Page - Target State

> **Route**: `/verify-email?email=...`
> **Reference**: Linear, Notion magic link flows
> **Goal**: Clear, calm confirmation - user knows exactly what to do

---

## Reference

Linear and Notion both show a simple "check your email" page after magic link submission. Key elements:
- Large email icon or illustration
- Clear heading
- Email address displayed (confirms where to look)
- Resend link with countdown
- Back/change email option

---

## Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     bg: bg-ui-bg                                                           │
│                                                                             │
│     NO card. Content floats (matches signin/signup).                       │
│                                                                             │
│                                                                             │
│                              [N]                                            │
│                         (Logo, 32px)                                        │
│                                                                             │
│                                                                             │
│                         📧                                                  │
│                    (Mail icon, 48px, muted)                                │
│                                                                             │
│                                                                             │
│                       Check your inbox                                      │
│                       ─────────────────                                     │
│                    (24px, font-semibold)                                   │
│                                                                             │
│               We sent a sign-in link to                                    │
│               user@example.com                                             │
│                    (14px, secondary + bold email)                          │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ ↻  Resend email (2:00)        │                        │
│                    └───────────────────────────────┘                        │
│                         (secondary, disabled while countdown)              │
│                                                                             │
│                    Use a different email →                                 │
│                         (14px, brand link)                                 │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## States

### 1. Default (Waiting)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         📧                                                  │
│                                                                             │
│                    Check your inbox                                         │
│                                                                             │
│               We sent a sign-in link to                                    │
│               user@example.com                                             │
│                                                                             │
│                    [ ↻ Resend email (1:45) ]  ← disabled, countdown        │
│                                                                             │
│                    Use a different email →                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Resend Available

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    [ ↻ Resend email ]  ← enabled, no countdown             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Resending

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    [ ○ Sending... ]  ← spinner, disabled                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Resent Success

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│               ✓ Email sent! Check your inbox.                              │
│                    (toast, then back to countdown)                         │
│                                                                             │
│                    [ ↻ Resend email (2:00) ]  ← reset countdown            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5. No Email Param (Error)

If user navigates directly to `/verify-email` without email param:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    Redirect to /signin                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Specifications

### Layout

| Element | Value | Tailwind |
|---------|-------|----------|
| Page padding | 16px | `p-4` |
| Content max-width | 360px | `max-w-[360px]` |
| Icon size | 48px | `w-12 h-12` |
| Logo → Icon | 48px | `mt-12` |
| Icon → Heading | 24px | `mt-6` |
| Heading → Subtitle | 8px | `mt-2` |
| Subtitle → Button | 32px | `mt-8` |
| Button → Link | 16px | `mt-4` |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Heading | 24px | 600 | `text-ui-text` |
| Subtitle | 14px | 400 | `text-ui-text-secondary` |
| Email (in subtitle) | 14px | 600 | `text-ui-text` |
| Button text | 14px | 500 | varies |
| Link | 14px | 500 | `text-brand` |
| Countdown | 14px | 400 | `text-ui-text-tertiary` |

### Button States

| State | Background | Text | Cursor |
|-------|------------|------|--------|
| Disabled (countdown) | `bg-ui-bg-secondary` | `text-ui-text-tertiary` | `cursor-not-allowed` |
| Enabled | `bg-ui-bg-secondary` | `text-ui-text` | `cursor-pointer` |
| Sending | `bg-ui-bg-secondary` | `text-ui-text-tertiary` + spinner | `cursor-wait` |

### Countdown Logic

- Initial countdown: 120 seconds (2 minutes)
- After resend: reset to 120 seconds
- Display format: `M:SS` (e.g., "2:00", "1:45", "0:03")
- When countdown reaches 0, button becomes enabled

---

## Accessibility

### Focus Order

1. Logo (link to home)
2. Resend button
3. "Use different email" link

### Screen Reader

- Icon has `aria-hidden="true"`
- Countdown announced via `aria-live="polite"` when it changes to 0
- Button state communicated via `aria-disabled`

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No email param | Redirect to `/signin` |
| Invalid email format | Redirect to `/signin` |
| Resend fails | Toast error, re-enable button |
| Rate limited | Toast "Please wait before trying again" |
