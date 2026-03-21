# Forgot Password Page - Current State

> **Route**: `/forgot-password`
> **Status**: REVIEWED, with reset-step sparsity still worth one more pass
> **Last Updated**: 2026-03-21


> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

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

- Forgot-password now shares the cleaner auth shell used by sign-in and signup.
- Step 1 uses `Reset your password` with the sign-in link in the subtitle row.
- Step 2 switches to `Check your email` and preserves the requested email address through session storage.
- The reset flow sits inside the same elevated auth panel with compact legal links at the bottom.
- The reset-step screenshot is now deterministic instead of depending on session-storage-only local flow.

---

## Recent Improvements

- Removed the old back-link pattern and the busier card stack.
- The reset request and reset-code views now inherit the same calmer auth shell.
- Subtitle links are in the right place instead of floating below the form.
- Theme parity is much closer to the rest of the auth suite.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| The reset-code step is still visually sparse once the user reaches the second state | `ResetPasswordForm` | MEDIUM |
| Desktop light mode still over-emphasizes the marketing rail for a utility flow | Shared auth shell | MEDIUM |
| This page does not need much shell, so the panel can still be simplified further | Shared auth shell | LOW |

---

## Source Files

- `src/routes/forgot-password.tsx`
- `src/components/Auth/AuthPageLayout.tsx`
- `src/components/Auth/ResetPasswordForm.tsx`
