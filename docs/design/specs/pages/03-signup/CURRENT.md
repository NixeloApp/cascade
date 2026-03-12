# Sign Up Page - Current State

> **Route**: `/signup`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: 2026-03-12

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

- Signup now shares the same split auth shell as sign-in instead of the older isolated card treatment.
- The page title is `Create your account`, with the sign-in switch link in the subtitle line.
- Desktop keeps the marketing rail on the left; mobile collapses to a single stacked auth flow.
- The main panel still needs to handle the email expansion and verification states without losing hierarchy.

---

## Recent Improvements

- The shared auth shell is materially cleaner and more product-like than the previous version.
- Legal copy is reduced to a compact footer line.
- The page-level account-switching copy is now in the right place.
- Theme parity is much better across dark, light, tablet, and mobile captures.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| The expanded signup and verification states still make the panel feel busier and taller than the rest of the auth suite | `SignUpForm` / `EmailVerificationForm` | MEDIUM |
| Desktop light mode still lets the left marketing rail compete a bit too much with the form | Shared auth shell | MEDIUM |
| The signup surface is improved, but the panel still has more shell than necessary for a simple auth action | Shared auth shell | LOW |

---

## Source Files

- `src/routes/signup.tsx`
- `src/components/Auth/AuthPageLayout.tsx`
- `src/components/Auth/SignUpForm.tsx`
- `src/components/Auth/EmailVerificationForm.tsx`
