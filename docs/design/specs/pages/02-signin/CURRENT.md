# Sign In Page - Current State

> **Route**: `/signin`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: 2026-03-09

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

- Shared auth shell now uses a split layout on desktop: a restrained marketing rail on the left and the sign-in form in a single elevated panel on the right.
- Mobile collapses into a single column with a compact logo pill, short product strapline, and the auth panel directly underneath.
- The page title is now explicit: `Sign in to Nixelo`.
- The account-switch link lives in the subtitle row instead of being buried below the form.
- Legal copy was reduced to a compact footer line with `Terms of Service` and `Privacy Policy`.

---

## Recent Improvements

- Removed the old back-link and the heavier nested-card auth treatment.
- Simplified the shared auth shell in `src/components/Auth/AuthPageLayout.tsx`.
- Kept the sign-in flow focused on the two real choices: Google or email/password.
- Brought light and dark screenshots into the same layout system.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| Desktop light mode still gives the left marketing rail slightly too much attention versus the form | Shared auth shell | MEDIUM |
| The auth panel is calmer than before, but still a little over-shelled for such a simple task | Shared auth shell | MEDIUM |
| CTA weighting between Google and email could be tighter in the collapsed email state | `SignInForm` | LOW |

---

## Source Files

- `src/routes/signin.tsx`
- `src/components/Auth/AuthPageLayout.tsx`
- `src/components/Auth/SignInForm.tsx`
- `src/components/Auth/GoogleAuthButton.tsx`
