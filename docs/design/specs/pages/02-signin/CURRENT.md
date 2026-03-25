# Sign In Page - Current State

> **Route**: `/signin`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-25

> **Spec Contract**: This file stays explicit on structure and reviewed states so auth-shell drift is easy to spot.

---

## Screenshot Matrix

| Viewport | Base Sign-In | Verify 2FA |
|----------|--------------|------------|
| Desktop Dark | ![](screenshots/desktop-dark.png) | ![](screenshots/desktop-dark-verify-2fa.png) |
| Desktop Light | ![](screenshots/desktop-light.png) | ![](screenshots/desktop-light-verify-2fa.png) |
| Tablet Light | ![](screenshots/tablet-light.png) | ![](screenshots/tablet-light-verify-2fa.png) |
| Mobile Light | ![](screenshots/mobile-light.png) | ![](screenshots/mobile-light-verify-2fa.png) |

---

## Structure

```text
┌──────────────────────────────────────────────────────────────┐
│ Public auth shell                                            │
│ bg: quiet page surface                                       │
│                                                              │
│                    compact centered stack                    │
│                    ┌────────────────────────────────────┐    │
│                    │ Nixelo logo                        │    │
│                    │ eyebrow: Secure account access     │    │
│                    │ title + subtitle/link row          │    │
│                    │ Google CTA                         │    │
│                    │ divider                            │    │
│                    │ collapsed email CTA                │    │
│                    │ or expanded email/password form    │    │
│                    │ compact legal footer               │    │
│                    └────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Current UI

- The desktop and mobile routes now use the same one-column auth shell. The old desktop-only marketing rail is gone.
- The canonical screenshot shows the collapsed state: Google first, then a quieter `Continue with email` reveal.
- Clicking `Continue with email` swaps in the real credential fields with the first input focused immediately.
- The 2FA screenshot remains part of the reviewed matrix, so the sign-in route is not only reviewed at its initial public state.
- Legal links stay present but visually low-weight.

---

## Recent Improvements

- Replaced the duplicated auth email-reveal height hack with one shared progressive-disclosure component.
- Removed the brittle `max-h-*` transition pattern from the sign-in form.
- Added more specific sign-in guidance for common failures such as unverified email and temporary lockout.
- Refreshed the reviewed screenshots so this spec now matches the actual one-column auth shell on the branch.

---

## Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | The expanded email/password state is tested but not yet a first-class reviewed screenshot variant in this spec folder | screenshot depth | LOW |
| 2 | The route still opts out of SSR entirely, which is acceptable operationally but not ideal for a lightweight public page | route config | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/signin.tsx` | Sign-in route definition |
| `src/components/Auth/AuthPageLayout.tsx` | Shared centered auth shell |
| `src/components/Auth/SignInForm.tsx` | Google + progressive email/password sign-in |
| `src/components/Auth/AuthEmailFormSection.tsx` | Shared collapsed/expanded email form shell |

---

## Summary

The sign-in page is now a minimal centered auth surface with a shared progressive email reveal instead of a bespoke animated form block. The remaining debt is small: public-route SSR and deeper screenshot review for the expanded credential state.
