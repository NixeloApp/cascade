# Forgot Password Page - Current State

> **Route**: `/forgot-password`
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

### Step 1: Email Entry

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
│         │           Forgot password?                  │   shadow-card       │
│         │     Enter your email and we'll send you     │                     │
│         │              a reset code                   │   SLOP: Kill card   │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │ ✉  Email                          │   │                     │
│         │     └───────────────────────────────────┘   │                     │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │        Send reset code            │   │                     │
│         │     └───────────────────────────────────┘   │                     │
│         │                                             │                     │
│         │         Back to sign in                     │ ← Should be below   │
│         │                                             │   heading, not form │
│         │     By continuing, you acknowledge that     │ ← SLOP: Too verbose │
│         │     you understand and agree to the         │                     │
│         │     Terms & Conditions and Privacy Policy   │                     │
│         │                                             │                     │
│         └─────────────────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Code Entry + New Password

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│         ← Back to Home                                                      │
│                                                                             │
│         ┌─────────────────────────────────────────────┐                     │
│         │                                             │                     │
│         │              [Nixelo Logo 48px]             │                     │
│         │                                             │                     │
│         │            Reset password                   │                     │
│         │     Enter the code from your email          │                     │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │  8-digit code                     │   │                     │
│         │     └───────────────────────────────────┘   │                     │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │  New password                     │   │                     │
│         │     └───────────────────────────────────┘   │                     │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │        Reset password             │   │                     │
│         │     └───────────────────────────────────┘   │                     │
│         │                                             │                     │
│         │     Didn't receive a code? Try again        │                     │
│         │                                             │                     │
│         │     [Legal text...]                         │                     │
│         │                                             │                     │
│         └─────────────────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/forgot-password.tsx` | Route + form logic | 99 |
| `src/components/auth/AuthPageLayout.tsx` | Shared layout (THE PROBLEM) | 106 |
| `src/components/auth/ForgotPasswordForm.tsx` | Unused legacy form | 62 |
| `src/components/auth/ResetPasswordForm.tsx` | Code + new password form | 70 |
| `src/components/auth/AuthLink.tsx` | Styled link/button | ~30 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Card wrapper (`card-subtle p-8 shadow-card`) | `AuthPageLayout.tsx:47` | HIGH |
| 2 | "Back to Home" link with arrow | `AuthPageLayout.tsx:19-44` | HIGH |
| 3 | Verbose legal text (3 lines) | `AuthPageLayout.tsx:83-100` | MEDIUM |
| 4 | 6 staggered animations (0.05s - 0.4s delays) | `AuthPageLayout.tsx` throughout | MEDIUM |
| 5 | "Back to sign in" placed below form | `forgot-password.tsx:93-95` | MEDIUM |
| 6 | Full logo (48px) could be smaller | `AuthPageLayout.tsx:57` | LOW |
| 7 | `max-w-md` (448px) slightly too wide | `AuthPageLayout.tsx:17` | LOW |
| 8 | Unused `ForgotPasswordForm.tsx` component | `components/auth/` | LOW |

---

## Summary

Same issues as signin/signup:
- Unnecessary card wrapper
- Patronizing "Back to Home" link
- Verbose legal text
- Staggered animations
- Generic heading ("Forgot password?")
- "Back to sign in" link in wrong place (should be in subtitle)
- Unused legacy component (`ForgotPasswordForm.tsx`)
