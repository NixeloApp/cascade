# Invite Page - Target State

> **Route**: `/invite/:token`
> **Reference**: Linear, Notion invite flows
> **Goal**: Clean, professional, no card wrapper

---

## Design Principles

1. **No card wrapper** - content floats on background like auth pages
2. **Simple heading** - "Join {project}" not "You're Invited!"
3. **Compact details** - inline, not a separate box
4. **Consistent error states** - match auth page patterns

---

## Structure

### Valid Invite (Authenticated)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     bg: bg-ui-bg                                                           │
│                                                                             │
│     NO card. Content floats (matches auth pages).                          │
│                                                                             │
│                              [N]                                            │
│                         (Logo, 32px)                                        │
│                                                                             │
│                                                                             │
│                       Join ProjectName                                      │
│                       ─────────────────                                     │
│                    (24px, font-semibold)                                   │
│                                                                             │
│               John Smith invited you as an editor                          │
│                    (14px, secondary)                                       │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │       Accept Invitation       │                        │
│                    └───────────────────────────────┘                        │
│                         (primary, full width)                              │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Valid Invite (Unauthenticated)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [N]                                            │
│                                                                             │
│                       Join ProjectName                                      │
│                                                                             │
│               John Smith invited you as an editor                          │
│                                                                             │
│               Sign in to user@example.com to continue                      │
│                    (14px, tertiary)                                        │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ G  Continue with Google       │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                    ──────────── or ────────────                            │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ ✉  Continue with email        │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State (Invalid/Expired/Revoked)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [N]                                            │
│                                                                             │
│                       Invitation expired                                    │
│                       ─────────────────                                     │
│                    (24px, font-semibold)                                   │
│                                                                             │
│               This invitation has expired. Ask John Smith                  │
│               to send a new one.                                           │
│                    (14px, secondary)                                       │
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
| Card wrapper | Yes (`shadow-lg rounded-2xl`) | **NO** |
| Heading | "You're Invited!" | "Join {projectName}" |
| Details box | Separate `bg-ui-bg-secondary` box | Inline text |
| Error icons | 48px in colored circles | No icons, text only |
| Disclaimer | "By accepting, you'll join..." | **NONE** |
| Max width | 448px (`max-w-md`) | 360px |
| Header logo | Separate header element | Inline with content |

---

## States

### Loading
- Logo visible
- Content area shows skeleton or spinner
- Subtle, not dramatic

### Invalid Token
- Heading: "Invalid invitation"
- Subtitle: "This link is invalid or has been removed."
- Button: "Go to Home" (secondary)

### Expired
- Heading: "Invitation expired"
- Subtitle: "This invitation has expired. Ask {inviterName} to send a new one."
- Button: "Go to Home" (secondary)

### Revoked
- Heading: "Invitation cancelled"
- Subtitle: "This invitation was cancelled by the team administrator."
- Button: "Go to Home" (secondary)

### Already Accepted
- Heading: "Already joined"
- Subtitle: "You've already accepted this invitation."
- Button: "Go to Dashboard" (primary)

### Pending (Authenticated)
- Heading: "Join {projectName}"
- Subtitle: "{inviterName} invited you as {role}"
- Button: "Accept Invitation" (primary)

### Pending (Unauthenticated)
- Heading: "Join {projectName}"
- Subtitle: "{inviterName} invited you as {role}"
- Additional: "Sign in to {email} to continue"
- Embedded SignInForm

---

## Specifications

### Layout

| Element | Value | Tailwind |
|---------|-------|----------|
| Page padding | 16px | `p-4` |
| Content max-width | 360px | `max-w-[360px]` |
| Logo → Heading | 48px | `mt-12` |
| Heading → Subtitle | 8px | `mt-2` |
| Subtitle → Form/Button | 32px | `mt-8` |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Heading | 24px | 600 | `text-ui-text` |
| Subtitle | 14px | 400 | `text-ui-text-secondary` |
| Inviter name | 14px | 600 | `text-ui-text` |
| Role | 14px | 400 | `text-ui-text-secondary` |

---

## Accessibility

### Focus Order (Authenticated)
1. Logo (link)
2. Accept button

### Focus Order (Unauthenticated)
1. Logo (link)
2. Google button
3. Email button / form inputs

### Error States
- Clear heading describes the problem
- Action button is obvious
- No confusing iconography
