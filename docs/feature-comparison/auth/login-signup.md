# Login/Signup

## Overview

Login and signup flows are the entry points for user authentication. A well-designed auth experience balances security with usability, offering multiple authentication methods while preventing unauthorized access.

---

## plane

### Available Auth Methods

| Method | Configurable | Description |
|--------|--------------|-------------|
| Email/Password | Yes | Traditional credentials |
| Magic Link | Yes | Passwordless via email code |
| Google OAuth | Yes | OAuth 2.0 |
| GitHub OAuth | Yes | OAuth 2.0 + org filtering |
| GitLab OAuth | Yes | OAuth 2.0 |
| Gitea OAuth | Yes | Self-hosted Git |

### Routes

- Sign-up: `/sign-up`
- Sign-in: `/` (root redirects)
- Forgot Password: `/accounts/forgot-password`
- Reset Password: `/accounts/reset-password/<token>`
- Set Password: `/accounts/set-password`

### Sign-Up Flow

**Step 1: Email Entry**
- Component: `AuthEmailForm`
- Validates email format
- Checks if user exists via `/auth/email-check/`

**Step 2: Authentication Method**
- If SMTP + magic link enabled → Magic code entry
- Else → Password entry

**Step 3: Password Entry** (if email/password)
- Minimum: Uses zxcvbn (score ≥ 3)
- Confirm password required
- Password strength indicator

**Step 3: Magic Code** (if magic link)
- 6-character code sent via email
- Resend with 5-second countdown
- Code expiration handling

**Step 4: Account Creation**
- User created in database
- Redirect to workspace/dashboard

### Sign-In Flow

**Step 1: Email Entry**
- Check user existence
- Determine auth method

**Step 2: Password or Magic Code**
- Based on configuration and user status

**Step 3: Session Creation**
- JWT-based session
- Redirect to dashboard

### Password Reset

1. User enters email at `/accounts/forgot-password`
2. Backend generates token (Base64 UID + Django token)
3. Email sent with reset link
4. User clicks link, enters new password
5. Password validated and updated
6. Redirect to sign-in

### OAuth Flow

1. User clicks OAuth provider button
2. Redirect to backend initiate endpoint
3. Authorization URL generated with state
4. User redirected to provider
5. User grants permissions
6. Callback with authorization code
7. Code exchanged for access token
8. User info retrieved
9. User created/updated
10. Session created, redirect to app

### UI Components

- `AuthBase`: Root wrapper
- `AuthRoot`: Mode management (SIGN_IN/SIGN_UP)
- `AuthFormRoot`: Multi-step orchestrator
- `AuthEmailForm`: Email input
- `AuthPasswordForm`: Password input + strength
- `AuthUniqueCodeForm`: Magic code input
- `OAuthOptions`: OAuth buttons
- `OAuthButton`: Individual provider button

### Validation & Error Handling

**Error Codes** (5000-5190 range):
- 5030: User already exists
- 5045, 5050: Invalid email
- 5040: Required fields missing
- 5021: Password too weak
- 5035: Authentication failed
- 5095, 5097: Code expired
- 5090, 5092: Code invalid

**Error Display**:
- Banner alerts (top of form)
- Inline field errors
- Custom error messages with links

### Security Features

- CSRF protection (Django middleware)
- Rate limiting (`AuthenticationThrottle`)
- Password hashing (Django built-in)
- Token expiration validation

---

## Cascade

### Available Auth Methods

| Method | Configurable | Description |
|--------|--------------|-------------|
| Email/Password | Default | With OTP verification |
| Google OAuth | Default | OAuth 2.0 |

### Routes

- Sign-in: `/signin`
- Sign-up: `/signup`
- Forgot Password: `/forgot-password`
- Verify 2FA: `/verify-2fa`
- Onboarding: `/onboarding`

### Sign-Up Flow

**Step 1: Choose Method**
- Google OAuth button
- Email/Password form (expandable)

**Step 2: Email/Password Entry**
- Email validation (HTML5)
- Password minimum 8 characters

**Step 3: Email Verification**
- 8-digit OTP sent via email
- User enters code
- Code validated

**Step 4: Account Creation**
- User created
- Redirect to `/app` gateway
- Gateway → onboarding or dashboard

### Sign-In Flow

**Step 1: Choose Method**
- Google OAuth button
- Email/Password form

**Step 2: Credential Validation**
- Password verified
- Check 2FA status

**Step 3: 2FA Check** (if enabled)
- If 2FA enabled and session not verified → `/verify-2fa`
- Else → proceed to app

**Step 4: Destination Routing**
- `getRedirectDestination` query determines:
  - Email not verified → stay on auth
  - 2FA needed → `/verify-2fa`
  - Onboarding needed → `/onboarding`
  - Has org → `/dashboard`
  - Default → `/app`

### Password Reset

1. User at `/signin` clicks "Forgot password?"
2. Redirects to `/forgot-password`
3. User enters email
4. Backend rate limits per IP and email
5. Async OTP generation (prevents timing attacks)
6. Always returns `{ success: true }` (email enumeration protection)
7. User receives 8-digit code (15 min expiration)
8. User enters code + new password
9. Password updated, redirect to `/app`

### OAuth Flow (Google)

1. User clicks "Continue with Google"
2. OAuth popup/redirect
3. Google authenticates
4. Callback with credentials
5. User created if first time
6. Session created
7. Redirect to `/app` gateway

### UI Components

- `AuthPageLayout`: Page wrapper
- `AuthRedirect`: Redirect authenticated users
- `SignInForm`: Sign-in form
- `SignUpForm`: Sign-up form
- `GoogleAuthButton`: OAuth button
- `ForgotPasswordForm`: Password reset
- `ResetPasswordForm`: New password entry
- `EmailVerificationForm`: OTP verification

### Validation & Error Handling

**Validation**:
- Email format (HTML5)
- Password 8+ characters
- OTP code format (8 digits)

**Error Display**:
- Toast notifications
- Non-blocking submission
- User-friendly messages

### Security Features

- Rate limiting (IP + email-based)
- Email enumeration protection
- Async password reset scheduling
- OTP expiration (15 minutes)
- 2FA integration

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Email/Password | Yes | Yes | tie |
| Magic Link | Yes | No | plane |
| Google OAuth | Yes | Yes | tie |
| GitHub OAuth | Yes | No | plane |
| GitLab OAuth | Yes | No | plane |
| Multiple OAuth | 4 providers | 1 provider | plane |
| Password strength | zxcvbn | Min 8 chars | plane |
| Email verification | Magic code | OTP code | tie |
| Password reset | Token link | OTP code | tie |
| Remember me | No | No | tie |
| Rate limiting | Yes | Yes | tie |
| CSRF protection | Yes | Convex built-in | tie |
| Email enumeration prevention | No | Yes | Cascade |
| 2FA integration | No | Yes | Cascade |
| Smart redirect | Basic | Advanced | Cascade |
| Onboarding flow | Yes | Yes | tie |
| Error handling | Detailed codes | Toast messages | plane |
| GitHub org filtering | Yes | No | plane |

---

## Recommendations

1. **Priority 1**: Add more OAuth providers
   - GitHub OAuth (most requested)
   - Microsoft OAuth (enterprise)
   - OIDC generic (custom providers)

2. **Priority 2**: Add magic link option
   - Passwordless sign-in
   - Email code entry
   - Good for mobile users

3. **Priority 3**: Add password strength indicator
   - Visual feedback during signup
   - zxcvbn or similar library
   - Minimum score requirement

4. **Priority 4**: Add detailed error codes
   - Specific error handling
   - Better debugging
   - User-friendly messages per code

5. **Priority 5**: Add device management
   - List active sessions
   - Revoke sessions
   - Device trust

---

## Cascade Strengths

1. **Email Enumeration Protection**: Always returns success on password reset
2. **Async Password Reset**: Prevents timing attacks
3. **2FA Integration**: Built into sign-in flow
4. **Smart Redirect Logic**: `getRedirectDestination` handles all states
5. **OTP-Based Verification**: More secure than link-based

---

## Implementation: GitHub OAuth

```typescript
// Add to auth.ts providers
import GitHub from "@auth/core/providers/github";

export default {
  providers: [
    Password,
    Google,
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
  ],
};

// Frontend component
function GitHubAuthButton({ mode }: { mode: "signIn" | "signUp" }) {
  const { signIn } = useAuthActions();

  const handleClick = () => {
    void signIn("github", { redirectTo: "/app" });
  };

  return (
    <Button variant="secondary" onClick={handleClick} className="w-full">
      <GitHubIcon className="mr-2 size-4" />
      {mode === "signUp" ? "Sign up with GitHub" : "Sign in with GitHub"}
    </Button>
  );
}
```

---

## Implementation: Password Strength Indicator

```tsx
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";

// Initialize zxcvbn
zxcvbnOptions.setOptions({
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
});

function PasswordStrengthIndicator({ password }: { password: string }) {
  const result = zxcvbn(password);
  const score = result.score; // 0-4

  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const colors = [
    "bg-status-error",
    "bg-status-warning",
    "bg-status-warning",
    "bg-status-success",
    "bg-status-success",
  ];

  return (
    <Flex direction="column" gap="1" className="mt-2">
      <Flex gap="1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded",
              i <= score ? colors[score] : "bg-ui-border"
            )}
          />
        ))}
      </Flex>
      <Typography variant="caption" className="text-ui-text-secondary">
        {labels[score]}
      </Typography>
    </Flex>
  );
}
```

---

## Screenshots/References

### plane
- Sign-up page: `~/Desktop/plane/apps/web/app/(all)/sign-up/page.tsx`
- Auth forms: `~/Desktop/plane/apps/web/core/components/account/auth-forms/`
- OAuth hooks: `~/Desktop/plane/apps/web/core/hooks/oauth/`
- OAuth providers: `~/Desktop/plane/apps/api/plane/authentication/provider/oauth/`
- Error codes: `~/Desktop/plane/apps/web/helpers/authentication.helper.tsx`

### Cascade
- Sign-in: `~/Desktop/cascade/src/routes/signin.tsx`
- Sign-up: `~/Desktop/cascade/src/routes/signup.tsx`
- Auth components: `~/Desktop/cascade/src/components/Auth/`
- Backend: `~/Desktop/cascade/convex/auth.ts`
- Password reset: `~/Desktop/cascade/convex/authWrapper.ts`
