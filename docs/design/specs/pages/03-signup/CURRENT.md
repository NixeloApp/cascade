# Sign Up Page - Current State

> **Route**: `/signup`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-25
> **Spec Contract**: Keep this file explicit about state transitions so signup density problems are visible in review.

---

## Screenshot Matrix

| Viewport | Base Signup | Verify State |
|----------|-------------|--------------|
| Desktop Dark | ![](screenshots/desktop-dark.png) | ![](screenshots/desktop-dark-verify.png) |
| Desktop Light | ![](screenshots/desktop-light.png) | ![](screenshots/desktop-light-verify.png) |
| Tablet Light | ![](screenshots/tablet-light.png) | ![](screenshots/tablet-light-verify.png) |
| Mobile Light | ![](screenshots/mobile-light.png) | ![](screenshots/mobile-light-verify.png) |

---

## Structure

```text
┌──────────────────────────────────────────────────────────────┐
│ Public auth shell                                            │
│                                                              │
│                    compact centered stack                    │
│                    ┌────────────────────────────────────┐    │
│                    │ Nixelo logo                        │    │
│                    │ eyebrow + title + sign-in link     │    │
│                    │ [step 0] Google CTA + email reveal │    │
│                    │ [step 1] progress pills + fields   │    │
│                    │ [step 2] progress pills + verify   │    │
│                    │ compact legal footer               │    │
│                    └────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Current UI

- Signup now matches sign-in structurally: one centered auth stack instead of a desktop split layout.
- The base reviewed state is the collapsed step-0 surface with Google first and email/password behind a reveal.
- The verification step is still separately reviewed and now uses a lighter progress indicator instead of tiny `Card` surfaces.
- When the email form is expanded, focus lands in the email field immediately and password helper copy stays compact.

---

## Recent Improvements

- Replaced the duplicated signup email expansion block with the shared `AuthEmailFormSection`.
- Removed the old `max-h-*` reveal animation and the extra shell around the credentials step.
- Flattened the step indicator into simple progress pills instead of using the `Card` recipe for decorative micro-surfaces.
- Refreshed the reviewed screenshots so this spec matches the actual current shell and verification state.

---

## Problems

| Problem | Area | Severity |
|---------|------|----------|
| The expanded email/password step still is not a dedicated reviewed screenshot variant in this folder | screenshot depth | LOW |
| The verification state is cleaner now, but it remains visually denser than the collapsed entry state because the OTP flow is naturally longer | verification state | LOW |

---

## Source Files

- `src/routes/signup.tsx`
- `src/components/Auth/AuthPageLayout.tsx`
- `src/components/Auth/SignUpForm.tsx`
- `src/components/Auth/AuthEmailFormSection.tsx`
- `src/components/Auth/AuthStepIndicator.tsx`
- `src/components/Auth/EmailVerificationForm.tsx`

---

## Summary

Signup is now structurally aligned with the rest of the public auth suite: one calm shell, one shared email reveal pattern, and lighter progress chrome. The only notable remaining debt is screenshot depth for the expanded credential step.
