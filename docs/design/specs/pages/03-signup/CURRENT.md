# Sign Up Page - Current State

> **Route**: `/signup`
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
│         │           Create an account                 │   shadow-card       │
│         │     Sign up to get started with Nixelo      │                     │
│         │                                             │   SLOP: Kill card   │
│         │     [ ● ● ○ ]  ← Step indicator             │ ← Unnecessary here  │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │ G  Sign up with Google            │   │                     │
│         │     └───────────────────────────────────┘   │                     │
│         │                                             │                     │
│         │     ──────────── or ────────────            │                     │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │ ✉  Continue with email            │   │ ← Expands to show   │
│         │     └───────────────────────────────────┘   │   email/password    │
│         │                                             │                     │
│         │     Already have an account? Sign in        │ ← In wrong place    │
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
| `src/routes/signup.tsx` | Route definition | 23 |
| `src/components/auth/AuthPageLayout.tsx` | Shared layout (THE PROBLEM) | 106 |
| `src/components/auth/SignUpForm.tsx` | Form logic + step indicator | 207 |
| `src/components/auth/GoogleAuthButton.tsx` | OAuth button | ~50 |
| `src/components/auth/AuthLink.tsx` | Styled link | ~20 |
| `src/components/auth/EmailVerificationForm.tsx` | OTP verification | ~100 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Card wrapper (`card-subtle p-8 shadow-card`) | `AuthPageLayout.tsx:47` | HIGH |
| 2 | "Back to Home" link with arrow | `AuthPageLayout.tsx:19-44` | HIGH |
| 3 | Verbose legal text (3 lines) | `AuthPageLayout.tsx:83-100` | MEDIUM |
| 4 | 6 staggered animations (0.05s - 0.4s delays) | `AuthPageLayout.tsx` throughout | MEDIUM |
| 5 | Step indicator shown before email expansion | `SignUpForm.tsx:101-111` | MEDIUM |
| 6 | "Already have account?" placed inside card | `signup.tsx:16-18` | MEDIUM |
| 7 | Generic subtitle | `signup.tsx:14` | LOW |
| 8 | Full logo (48px) could be smaller | `AuthPageLayout.tsx:57` | LOW |
| 9 | `max-w-md` (448px) slightly too wide | `AuthPageLayout.tsx:17` | LOW |
| 10 | Password hint styling inconsistent | `SignUpForm.tsx:154-156` | LOW |

---

## Summary

Same issues as signin, plus:
- Step indicator visible before user commits to email flow
- "Already have account?" link in wrong place (should be in subtitle)
