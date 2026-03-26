# Authentication Pages - Current State

> **Routes**: `/signin`, `/signup`, and shared public auth shell flows
> **Status**: REVIEWED
> **Last Updated**: 2026-03-25

---

## Purpose

The public authentication suite covers:

- signing in with Google or email/password
- signing up and verifying email
- routing existing users away from auth surfaces
- keeping forgot-password and verification flows visually aligned with the same shell

---

## Route Anatomy

```text
/signin
│
├── SignInRoute
│   └── AuthRedirect
│       └── AuthPageLayout
│           ├── logo
│           ├── eyebrow + title + signup link
│           └── SignInForm
│               ├── GoogleAuthButton
│               ├── AuthMethodDivider
│               └── AuthEmailFormSection
│                   ├── [collapsed] Continue with email
│                   └── [expanded] email + password + forgot-password + submit
│
/signup
│
├── SignUpRoute
│   └── AuthRedirect
│       └── AuthPageLayout
│           ├── logo
│           ├── eyebrow + title + signin link
│           └── SignUpForm
│               ├── [step 0] GoogleAuthButton + AuthMethodDivider + collapsed email CTA
│               ├── [step 1] AuthStepIndicator + AuthEmailFormSection + password strength
│               └── [step 2] AuthStepIndicator + EmailVerificationForm
│
/forgot-password
│
└── ForgotPasswordRoute
    └── AuthRedirect
        └── AuthPageLayout
            ├── request-reset state
            └── reset-code state
```

---

## Current Composition Walkthrough

### Shared shell

- `AuthPageLayout` is now a centered one-column stack, not a two-column marketing layout.
- The shell owns only the logo, eyebrow, title/subtitle slot, form content, and legal footer.
- This same shell is reused by sign-in, signup, forgot-password, verify-email, unsubscribe, and invite-adjacent auth flows.

### Sign in

- `SignInForm` keeps Google as the default primary choice, then reveals credentials only when the user asks for email.
- The credential reveal is now owned by `AuthEmailFormSection`, which avoids duplicated height-transition logic.
- Focus moves into the email field on reveal, and common failures now get more specific messages for unverified email and temporary lockout.
- SSO discovery still debounces domain lookup before checking for Google Workspace SSO.

### Sign up

- `SignUpForm` uses the same shared email-reveal shell as sign-in.
- The first credential step keeps password strength feedback inline but visually compact.
- The verification step still uses `EmailVerificationForm`, but the progress chrome is flatter and lighter than before.
- The route still supports `?step=verify&email=...` for deterministic screenshot capture.

### Screenshot coverage

- `02-signin`, `03-signup`, and `04-forgot-password` now have current reviewed screenshots for desktop dark, desktop light, tablet light, and mobile light.
- Sign-in also carries reviewed 2FA captures.
- Signup carries reviewed verification captures.
- The current auth matrix still emphasizes canonical and verification states more than the expanded email-entry state.

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | Expanded email-entry states are covered by tests and E2E helpers, but not yet checked in as first-class auth screenshots | screenshot depth | LOW |
| 2 | Public auth routes still use `ssr: false`, which is operationally fine but heavier than ideal for simple public pages | routing | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/signin.tsx` | Sign-in route |
| `src/routes/signup.tsx` | Signup route with verification-search parsing |
| `src/routes/forgot-password.tsx` | Forgot-password request + reset flow |
| `src/components/Auth/AuthPageLayout.tsx` | Shared centered auth shell |
| `src/components/Auth/AuthEmailFormSection.tsx` | Shared collapsed/expanded email credential shell |
| `src/components/Auth/SignInForm.tsx` | Sign-in behavior and error handling |
| `src/components/Auth/SignUpForm.tsx` | Signup flow and verification transition |
| `src/components/Auth/AuthStepIndicator.tsx` | Lightweight progress pills for multi-step auth |
| `src/components/Auth/EmailVerificationForm.tsx` | Verification code entry |

---

## Summary

The auth suite is now structurally consistent: one public shell, one shared email reveal abstraction, and current reviewed screenshots that match the branch. The remaining gaps are small and mostly about deeper screenshot coverage plus the long-standing `ssr: false` choice.
