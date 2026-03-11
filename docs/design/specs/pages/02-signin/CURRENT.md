# Sign In Page - Current State

> **Route**: `/signin`
> **Status**: 🟡 Cleaner than before, but still not documented sharply enough
> **Last Updated**: 2026-03-11

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

- Shared auth shell now uses a split layout on desktop with a marketing rail on the left and the
  form panel on the right.
- Mobile collapses into a single-column stack with a compact logo pill and shortened strapline.
- The page title is explicit: `Sign in to Nixelo`.
- The account-switch link sits in the subtitle row instead of being buried below the form.
- Legal copy is reduced to a compact footer line.

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

---

## Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | Light mode still feels visually wrong, not just slightly flat: the marketing rail chroma and atmospherics do not belong to the same system as the light form canvas | shared auth shell | HIGH |
| 2 | Desktop light mode still gives the left rail slightly too much attention versus the actual sign-in task | layout weighting | MEDIUM |
| 3 | The auth panel is calmer, but it still carries more shell than the interaction earns | auth shell / panel recipe | MEDIUM |
| 4 | The CURRENT doc had lost its structural diagnostics; that made the page easier to misread in reviews | design docs | MEDIUM |
| 5 | CTA weighting between Google and collapsed email state could still be tighter | `SignInForm` | LOW |

---

## Review Notes

- Keep this doc diagram-first. The auth pages are simple enough that the structural mistakes should
  be obvious in one screen.
- The next pass should focus on light-mode balance, not re-adding decorative complexity.
- If the left rail stays, it needs to support the form, not compete with it.

---

## Summary

The auth shell is materially better than the earlier version, but the light-theme relationship
between the marketing rail and the task panel is still not resolved. The doc is now back to being
useful for review instead of just describing what exists.
