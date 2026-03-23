# Authentication Pages - Implementation

> **Routes**: `/signin` and `/signup`

---

## Queries

### Sign In

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.auth.getRedirectDestination` | `convex/auth.ts` | `{}` | Determine where to send an already-authenticated user (dashboard, onboarding, etc.) |
| `api.sso.getForDomain` | `convex/sso.ts` | `{ domain }` | SSO discovery: check if email domain has Google Workspace SSO configured |
| `api.featureFlags.isGoogleAuthEnabled` | `convex/featureFlags.ts` | `{}` | Public query: whether Google OAuth is currently enabled |

### Sign Up

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.auth.getRedirectDestination` | `convex/auth.ts` | `{}` | Redirect authenticated users away from signup |
| `api.featureFlags.isGoogleAuthEnabled` | `convex/featureFlags.ts` | `{}` | Google OAuth availability |

---

## Mutations / Auth Actions

Auth operations use `@convex-dev/auth` `useAuthActions()` rather than standard Convex mutations:

| Action | Provider | Flow | Purpose |
|--------|----------|------|---------|
| `signIn("password", formData)` | Password | `signIn` | Email/password authentication |
| `signIn("password", formData)` | Password | `signUp` | Email/password registration (triggers email verification) |
| `signIn("google")` | Google OAuth | -- | Google OAuth redirect flow |

### FormData Shape (password provider)

```typescript
// Sign In
{ flow: "signIn", email: string, password: string }

// Sign Up
{ flow: "signUp", email: string, password: string }
```

---

## State Management

### SignInForm

| State | Type | Purpose |
|-------|------|---------|
| `submitting` | `boolean` | Loading state during password sign-in |
| `showEmailForm` | `boolean` | Whether email/password fields are expanded |
| `formReady` | `boolean` | Whether form fields are rendered and ready for submission |
| `hydrated` | `boolean` | CSR hydration complete flag |
| `email` | `string` | Email input value (used for SSO discovery) |

### SignUpForm

| State | Type | Purpose |
|-------|------|---------|
| `submitting` | `boolean` | Loading state during sign-up |
| `email` | `string` | Email value (passed to verification step) |
| `password` | `string` | Password value (for strength indicator) |
| `showVerification` | `boolean` | Whether to show OTP verification step |
| `showEmailForm` | `boolean` | Whether email/password fields are expanded |
| `formReady` | `boolean` | Form fields rendered flag |
| `hydrated` | `boolean` | CSR hydration complete flag |

---

## Component Tree

### Sign In

```
SignInRoute
└── AuthRedirect
    └── AuthPageLayout
        ├── [xl: left] AuthShowcasePanel
        │   ├── NixeloLogo
        │   ├── Headline typography
        │   └── AuthRailPoint[] (3 feature bullets)
        │
        └── [xl: right / mobile: full] AuthFormShell
            ├── NixeloLogo (mobile-only)
            ├── Typography (title, subtitle with Sign Up link)
            └── SignInForm
                ├── GoogleAuthButton
                ├── AuthMethodDivider
                └── form
                    ├── [collapsed: max-h-0] email + password inputs
                    ├── [expanded] AuthLinkButton ("Forgot password?")
                    └── Button ("Continue with email" / "Sign in")
```

### Sign Up

```
SignUpRoute
└── AuthRedirect
    └── AuthPageLayout
        ├── [xl: left] AuthShowcasePanel (same as sign-in)
        └── [xl: right / mobile: full] AuthFormShell
            ├── Typography (title, subtitle with Sign In link)
            └── SignUpForm
                ├── [step 0-1]
                │   ├── AuthStepIndicator (visible when step >= 1)
                │   ├── GoogleAuthButton
                │   ├── AuthMethodDivider
                │   └── form → SignUpEmailButton
                │       ├── [collapsed: max-h-0] email + password + PasswordStrengthIndicator
                │       └── Button ("Continue with email" / "Create account")
                │
                └── [step 2: verification]
                    └── SignUpVerificationStep
                        ├── AuthStepIndicator (step 2)
                        └── EmailVerificationForm (OTP input + resend)
```

---

## Permissions

- **Authentication**: Not required. These are public routes. `ssr: false` is set to disable server-side rendering.
- **AuthRedirect**: If the user is already authenticated, they are redirected away before seeing the form.
- **SSO discovery**: `sso.getForDomain` is a public query (works without auth).
- **Feature flags**: `isGoogleAuthEnabled` is a public query (works without auth).

---

## Data Flow

### Sign In

1. Route renders. `AuthRedirect` checks if user is authenticated and redirects if so.
2. `AuthPageLayout` renders the two-column layout with form shell.
3. User clicks "Continue with email" -> progressive disclosure animates open email/password fields.
4. As user types email, SSO discovery query fires for the email domain.
5. If SSO is detected, Google button text updates and password submission is blocked.
6. User submits form -> `signIn("password", formData)` -> on success, navigate to app -> on error, show toast.

### Sign Up

1. Route validates search params (`?step=verify&email=...`). If verification step is pre-populated, `SignUpForm` starts at step 2.
2. User clicks "Continue with email" -> form expands -> user enters email + password.
3. `PasswordStrengthIndicator` shows real-time strength feedback.
4. User submits -> `signIn("password", formData)` with `flow: "signUp"` -> triggers email verification.
5. Form transitions to step 2 -> `EmailVerificationForm` renders with OTP input.
6. User enters OTP code -> on verification success, navigate to app.

### Google OAuth

1. User clicks Google button -> `signIn("google")` -> browser redirects to Google consent screen.
2. After consent, Google redirects back to Convex OAuth callback.
3. Convex resolves the auth session and the client reactively picks up the authenticated state.
4. `AuthRedirect` fires and navigates to the dashboard.
