# Forgot Password Page - Current State

> **Route**: `/forgot-password`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-25
> **Spec Contract**: Keep this file aligned with the real shared auth shell rather than older split-layout assumptions.

---

## Screenshot Matrix

| Viewport | Base Flow | Reset Step |
|----------|-----------|------------|
| Desktop Dark | ![](screenshots/desktop-dark.png) | ![](screenshots/desktop-dark-reset.png) |
| Desktop Light | ![](screenshots/desktop-light.png) | ![](screenshots/desktop-light-reset.png) |
| Tablet Light | ![](screenshots/tablet-light.png) | ![](screenshots/tablet-light-reset.png) |
| Mobile Light | ![](screenshots/mobile-light.png) | ![](screenshots/mobile-light-reset.png) |

---

## Current UI

- Forgot-password now clearly lives in the same centered public auth shell as sign-in and signup.
- The entry state keeps the task narrow: headline, sign-in link, email field, submit button, and compact legal footer.
- The reset step persists the requested email and swaps to the OTP/new-password flow without changing shells.
- The reviewed screenshots are now consistent with the current branch layout instead of the older auth marketing-rail treatment.

---

## Recent Improvements

- Screenshot matrix was refreshed against the actual branch UI.
- The reset-step review path remains deterministic through the route-driven search/session-state flow.
- Shared auth-shell drift is gone from this spec; it now describes the same compact stack used by the other public auth pages.

---

## Problems

| Problem | Area | Severity |
|---------|------|----------|
| The reset-code step is still more utilitarian than polished on wide desktop because it is mostly form controls and little supporting structure | reset state | LOW |

---

## Source Files

- `src/routes/forgot-password.tsx`
- `src/components/Auth/AuthPageLayout.tsx`
- `src/components/Auth/ForgotPasswordForm.tsx`
- `src/components/Auth/ResetPasswordForm.tsx`

---

## Summary

Forgot-password is in the right shell and the reviewed screenshots are current again. The remaining issue is minor polish in the reset-code state rather than structural inconsistency.
