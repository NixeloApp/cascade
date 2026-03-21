# Sign In Page - Current State

> **Route**: `/signin`
> **Status**: 🟢 Auth shell now feels task-first and balanced
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

## Structure

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Shared auth shell                                                                           │
│ bg: public theme surface + atmospheric rail                                                 │
│                                                                                             │
│  ┌──────────────────── left rail ────────────────────┐  ┌──────── form panel ────────────┐ │
│  │ logo pill                                          │  │ Sign in to Nixelo              │ │
│  │ short product strapline                            │  │ Switch account link            │ │
│  │ supporting trust / positioning copy                │  │ [Continue with Google]         │ │
│  │                                                    │  │ divider                        │ │
│  │ NOTE: in light mode this rail can still pull too  │  │ email/password flow            │ │
│  │ much attention away from the actual task          │  │ legal footer line              │ │
│  └────────────────────────────────────────────────────┘  └─────────────────────────────────┘ │
│                                                                                             │
│ mobile: rail collapses above the form into one compact stack                               │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Current UI

- Shared auth shell now keeps the task dominant: the form panel is calmer, the left rail is
  narrower, and the proof content reads like workspace support instead of a second landing hero.
- Mobile collapses to a minimal brand row above the form instead of repeating the shell headline.
- The page title stays explicit: `Sign in to Nixelo`.
- The account-switch link remains in the subtitle row instead of being buried below the form.
- Legal copy stays reduced to a compact footer line.

---

## Files

| File | Purpose |
|------|---------|
| `src/routes/signin.tsx` | Route definition |
| `src/components/Auth/AuthPageLayout.tsx` | Shared auth shell |
| `src/components/Auth/SignInForm.tsx` | Email/password and Google flow |
| `src/components/Auth/GoogleAuthButton.tsx` | Google CTA |

---

## What Improved

| # | Improvement | Status |
|---|-------------|--------|
| 1 | Removed the old back-link and heavier nested-card treatment | Fixed |
| 2 | Shared auth shell is simpler than the older version | Improved |
| 3 | Sign-in flow now emphasizes the real choices instead of ornamental chrome | Improved |
| 4 | Light and dark now share the same structural layout | Fixed |
| 5 | Light mode now sits in the same palette family as landing instead of fighting it | Fixed |

---

## Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | Expanded/authenticated interaction states still need dedicated screenshot coverage so the suite doesn't regress outside the public default state | screenshot coverage | LOW |

---

## Review Notes

- Keep this doc diagram-first. The auth pages are simple enough that the structural mistakes should
  be obvious in one screen.
- The next auth review should focus on filled states, not shell rescue.
- The sign-in task now wins immediately, which is the right default for utility auth.

---

## Summary

The auth shell now behaves like a doorway back into the product instead of a mini marketing page.
The remaining review work is coverage-oriented: keep the expanded states captured so the cleaner
shell doesn't quietly drift again.
