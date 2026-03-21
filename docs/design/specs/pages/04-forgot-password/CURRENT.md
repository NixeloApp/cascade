# Forgot Password Page - Current State

> **Route**: `/forgot-password`
> **Status**: 🟢 Reset request flow is now appropriately minimal
> **Last Updated**: 2026-03-21

---

## Screenshots

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

---

## Current UI

- Forgot-password now shares the lighter auth shell used by sign-in and signup.
- Step 1 uses `Reset your password` with the sign-in link in the subtitle row, and the form body no
  longer repeats that headline inside the panel.
- Step 2 switches to `Check your email` and preserves the requested email address through session storage.
- The reset flow stays inside the same calmer auth panel with compact legal links at the bottom.

---

## Recent Improvements

- Removed the old back-link pattern and the busier card stack.
- The reset request and reset-code views now inherit the same calmer auth shell.
- Subtitle links stay in the right place instead of floating below the form.
- The reset request view no longer burns vertical space on duplicate heading chrome.
- Theme parity is much closer to the rest of the auth suite.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| The reset-code step still needs dedicated screenshot coverage so the shared intro/strength treatment cannot regress quietly | screenshot coverage | LOW |

---

## Source Files

- `src/routes/forgot-password.tsx`
- `src/components/Auth/AuthPageLayout.tsx`
- `src/components/Auth/ResetPasswordForm.tsx`
- `src/components/Auth/ForgotPasswordForm.tsx`
- `src/components/Auth/AuthFlowIntro.tsx`
