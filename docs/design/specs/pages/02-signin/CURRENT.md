# Sign In Page - Current State

> **Route**: `/signin`
> **Status**: 🔴 SLOP
> **Last Updated**: Run `pnpm screenshots` to regenerate

---

## Screenshots

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

---

## Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     bg: bg-ui-bg (white in light, #08090a in dark)                         │
│                                                                             │
│         ← Back to Home                    ← SLOP: Delete this              │
│                                                                             │
│         ┌─────────────────────────────────────────────┐                     │
│         │                                             │                     │
│         │              [Nixelo Logo 48px]             │ ← card-subtle       │
│         │                                             │   p-8              │
│         │              Welcome back                   │   shadow-card       │
│         │     Sign in to your account to continue     │                     │
│         │                                             │   SLOP: Kill card   │
│         │     ┌───────────────────────────────┐       │                     │
│         │     │ G  Sign in with Google        │       │                     │
│         │     └───────────────────────────────┘       │                     │
│         │                                             │                     │
│         │     ──────────── or ────────────            │                     │
│         │                                             │                     │
│         │     ┌───────────────────────────────┐       │                     │
│         │     │ ✉  Continue with email        │       │ ← Expands to show  │
│         │     └───────────────────────────────┘       │   email/password    │
│         │                                             │                     │
│         │     Don't have an account? Sign up          │                     │
│         │                                             │                     │
│         │     By continuing, you acknowledge that     │ ← SLOP: Too verbose │
│         │     you understand and agree to the         │                     │
│         │     Terms & Conditions and Privacy Policy   │                     │
│         │                                             │                     │
│         └─────────────────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/signin.tsx` | Route definition | 23 |
| `src/components/auth/AuthPageLayout.tsx` | Shared layout (THE PROBLEM) | 106 |
| `src/components/auth/SignInForm.tsx` | Form logic | 160 |
| `src/components/auth/GoogleAuthButton.tsx` | OAuth button | ~50 |
| `src/components/auth/AuthLink.tsx` | Styled link | ~20 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Card wrapper (`card-subtle p-8 shadow-card`) | `AuthPageLayout.tsx:47` | HIGH |
| 2 | "Back to Home" link with arrow | `AuthPageLayout.tsx:19-44` | HIGH |
| 3 | Verbose legal text (3 lines) | `AuthPageLayout.tsx:83-100` | MEDIUM |
| 4 | 6 staggered animations (0.05s - 0.4s delays) | `AuthPageLayout.tsx` throughout | MEDIUM |
| 5 | Generic heading "Welcome back" | `signin.tsx:14` | LOW |
| 6 | Generic subtitle | `signin.tsx:14` | LOW |
| 7 | Full logo (48px) could be smaller | `AuthPageLayout.tsx:57` | LOW |
| 8 | `max-w-md` (448px) slightly too wide | `AuthPageLayout.tsx:17` | LOW |

---

## Summary

Classic AI-slop patterns:
- Unnecessary card wrapper
- Patronizing "Back to Home" link
- Verbose legal text
- Staggered animations that feel gimmicky
- Template-speak heading ("Welcome back")
