# Sign In Page - Current State

> **Route**: `/signin`
> **Status**: REVIEWED, with small weighting follow-up only
> **Last Updated**: 2026-03-21


> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

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
- The screenshot suite also now covers the 2FA verification step instead of only the initial form.

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
| 1 | Desktop light mode still gives the left rail slightly too much attention versus the actual sign-in task | layout weighting | MEDIUM |
| 2 | The auth panel is calmer, but it still carries more shell than the interaction earns | auth shell / panel recipe | MEDIUM |
| 3 | CTA weighting between Google and collapsed email state could still be tighter | `SignInForm` | LOW |

---

## Review Notes

- Keep this doc diagram-first. The auth pages are simple enough that the structural mistakes should
  be obvious in one screen.
- The next pass should focus on task weighting, not light-mode rescue.
- If the left rail stays, it needs to support the form, not compete with it.

---

## Summary

The auth shell is now visually coherent in light mode. The remaining issue is simpler: the left
rail still needs slightly less emphasis so the sign-in task wins immediately.
