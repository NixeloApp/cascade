# Authentication Pages - Current State

> **Routes**: `/signin` and `/signup`
> **Status**: IMPLEMENTED
> **Last Updated**: 2026-03-22

---

## Purpose

The authentication pages handle user sign-in and sign-up with email/password and Google OAuth. They answer:

- How do I sign in to an existing account?
- How do I create a new account?
- Does my organization use Google Workspace SSO?
- How do I verify my email after signing up?
- Where do I go if I forgot my password?

---

## Route Anatomy

```
/signin
│
├── SignInRoute
│   └── AuthRedirect (bounces authenticated users to dashboard)
│       └── AuthPageLayout
│           ├── title = "Sign in to Nixelo"
│           ├── subtitle = "Don't have an account? Sign up →"
│           │
│           ├── [xl: left panel] AuthShowcasePanel (hidden on mobile)
│           │   ├── NixeloLogo
│           │   ├── Typography: headline + subtitle
│           │   └── AuthRailPoint[] (Capture, Coordinate, Deliver)
│           │
│           └── [xl: right panel / mobile: full width] AuthFormShell
│               ├── NixeloLogo (mobile only)
│               ├── Typography: "Secure account access" / title / subtitle
│               └── SignInForm
│                   ├── GoogleAuthButton ("Sign in with Google" or SSO variant)
│                   ├── AuthMethodDivider ("or")
│                   └── form
│                       ├── [collapsed] Button "Continue with email" (expands form)
│                       ├── [expanded] Input (email) + Input (password)
│                       ├── [expanded] AuthLinkButton "Forgot password?"
│                       └── Button "Sign in" (submit)

/signup
│
├── SignUpRoute
│   └── AuthRedirect
│       └── AuthPageLayout
│           ├── title = "Create your account"
│           ├── subtitle = "Already have an account? Sign in →"
│           │
│           └── SignUpForm
│               ├── [step 0] GoogleAuthButton + AuthMethodDivider + "Continue with email"
│               ├── [step 1] AuthStepIndicator + GoogleAuthButton + form
│               │   ├── Input (email) + Input (password, minLength=8)
│               │   ├── PasswordStrengthIndicator (when password has value)
│               │   └── Button "Create account"
│               └── [step 2: verification]
│                   ├── AuthStepIndicator (step 2)
│                   └── EmailVerificationForm (OTP code input)
```

---

## Current Composition Walkthrough

### Sign In (`/signin`)

1. **Route**: 25-line thin route. Wraps `SignInForm` in `AuthRedirect` and `AuthPageLayout`.
2. **AuthRedirect**: Checks `api.auth.getRedirectDestination`. If the user is already authenticated, redirects to dashboard or onboarding. Always renders children to avoid unmounting forms during auth transitions.
3. **AuthPageLayout**: Two-column layout on xl screens. Left panel shows a product showcase (NixeloLogo, headline, three rail points: Capture, Coordinate, Deliver). Right panel contains the form shell. On mobile, only the form shell is shown with a compact logo.
4. **SignInForm**: Progressive disclosure pattern:
   - Initially shows Google OAuth button and a "Continue with email" button (secondary variant).
   - Clicking "Continue with email" animates open the email + password fields.
   - Form supports SSO discovery: as the user types their email, `api.sso.getForDomain` checks if the domain has Google Workspace SSO. If so, the Google button text changes and password sign-in is blocked.
   - Submit calls `@convex-dev/auth` `signIn("password", formData)` with `flow: "signIn"`.
   - On success, navigates to `ROUTES.app.path`.
5. **Hydration safety**: Hidden `data-testid` markers track `hydrated` and `formReady` states for E2E testing. The submit button is disabled until hydrated.

### Sign Up (`/signup`)

1. **Route**: 44-line route with search parameter validation. Supports `?step=verify&email=...` for deep-linking to the verification step (used by screenshot tooling).
2. **SignUpForm**: Three-step flow:
   - **Step 0**: Google OAuth button and "Continue with email" (same progressive disclosure as sign-in).
   - **Step 1**: Email + password fields with `PasswordStrengthIndicator` that analyzes password strength in real-time. `AuthStepIndicator` shows progress. Submit calls `signIn("password", formData)` with `flow: "signUp"`, which triggers email verification.
   - **Step 2 (verification)**: `EmailVerificationForm` with OTP code input. On success, navigates to `ROUTES.app.path`.
3. **initialVerificationEmail**: The route can pre-populate the verification step via URL search params, enabling screenshot capture of the verification UI.

### Shared Components

- **AuthPageLayout**: Full-page layout with gradient background, showcase panel, and form shell. Uses `Card` recipe classes for panel styling.
- **GoogleAuthButton**: Calls `signIn("google")` via `@convex-dev/auth`. Shows Google logo SVG with brand-colored paths. Feature-flagged via `api.featureFlags.isGoogleAuthEnabled` -- shows "temporarily unavailable" when disabled.
- **AuthMethodDivider**: Visual "or" divider between OAuth and email sign-in.
- **AuthLink/AuthLinkButton**: Styled link for "Sign up" / "Sign in" cross-navigation and "Forgot password?" action.
- **AuthStepIndicator**: Step progress dots for the sign-up flow.

---

## Screenshot Matrix

### Sign In

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Sign Up

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](../03-signup/screenshots/desktop-dark.png) |
| Desktop | Light | ![](../03-signup/screenshots/desktop-light.png) |

### Sign Up — Verification

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](../03-signup/screenshots/desktop-dark-verify.png) |
| Desktop | Light | ![](../03-signup/screenshots/desktop-light-verify.png) |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| ~~1~~ | ~~No screenshot coverage for sign-up~~ **Fixed** — added sign-up and verification screenshots to the matrix (references from 03-signup spec) | ~~testing~~ | ~~MEDIUM~~ |
| 2 | The progressive disclosure animation uses `max-h-48` / `max-h-64` arbitrary values for expand/collapse | styling | LOW |
| 3 | SSO discovery fires a query on every keystroke as the user types their email domain | performance | LOW |
| 4 | The AuthShowcasePanel left-column content (Capture/Coordinate/Deliver rail points) is static marketing copy that may not match the current product | content | LOW |
| ~~5~~ | ~~Fragile hydrated + formReady two-phase approach~~ **Fixed** — removed both states, microtask scheduling, and FORM_HYDRATED marker. FORM_READY renders when email form is visible. Validation moved to submit handler. | ~~architecture~~ | ~~MEDIUM~~ |
| 6 | Error messages from `submitPasswordSignIn` are generic ("Could not sign in. Please check your credentials.") -- no specific guidance for common failures | UX | LOW |
| 7 | The `ssr: false` route option disables server-side rendering entirely for auth pages | performance | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/signin.tsx` | Sign-in route (25 lines) |
| `src/routes/signup.tsx` | Sign-up route with search param validation (44 lines) |
| `src/components/Auth/index.ts` | Auth component barrel exports |
| `src/components/Auth/AuthPageLayout.tsx` | Shared two-column auth layout |
| `src/components/Auth/AuthRedirect.tsx` | Authenticated user redirect |
| `src/components/Auth/SignInForm.tsx` | Sign-in form with email/password + Google OAuth |
| `src/components/Auth/SignUpForm.tsx` | Sign-up form with 3-step flow |
| `src/components/Auth/GoogleAuthButton.tsx` | Google OAuth button with feature flag |
| `src/components/Auth/AuthMethodDivider.tsx` | "or" divider between auth methods |
| `src/components/Auth/AuthLink.tsx` | Styled auth navigation links |
| `src/components/Auth/AuthStepIndicator.tsx` | Step progress indicator for sign-up |
| `src/components/Auth/PasswordStrengthIndicator.tsx` | Password strength meter |
| `src/components/Auth/EmailVerificationForm.tsx` | OTP code verification form |
| `src/components/Auth/ForgotPasswordForm.tsx` | Forgot password flow (linked from sign-in) |
| `src/components/Auth/authFlowSearch.ts` | URL search param helpers for auth flows |
| `convex/auth.ts` | `getRedirectDestination` query |
| `convex/sso.ts` | `getForDomain` SSO discovery query |
| `convex/featureFlags.ts` | `isGoogleAuthEnabled` public query |
