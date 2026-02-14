# Sign Up Page - Implementation

> **Priority**: P0 - Auth Flow
> **Scope**: Shares `AuthPageLayout.tsx` with signin (fixes both)

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/auth/AuthPageLayout.tsx` | **REWRITE** | Remove card, back link, verbose legal, staggered animations |
| `src/routes/signup.tsx` | MODIFY | Update heading, move signin link to subtitle prop |
| `src/components/auth/SignUpForm.tsx` | MODIFY | Hide step indicator in step 0, styling tweaks |

---

## AuthPageLayout.tsx - Target Code

**NOTE**: This is the SAME as signin - fixing AuthPageLayout fixes both pages.

```tsx
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NixeloLogo } from "@/components/landing";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

interface AuthPageLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

export function AuthPageLayout({ title, subtitle, children }: AuthPageLayoutProps) {
  return (
    <Flex
      align="center"
      justify="center"
      className="min-h-screen w-full bg-ui-bg p-4"
    >
      {/* Main content - single fade-in animation */}
      <div className="w-full max-w-[360px] animate-fade-in">
        {/* Logo */}
        <Link
          to={ROUTES.home.path}
          className="block w-fit hover:opacity-80 transition-opacity"
        >
          <NixeloLogo size={32} />
        </Link>

        {/* Heading */}
        <Typography
          variant="h1"
          className="mt-8 text-2xl font-semibold tracking-tight"
        >
          {title}
        </Typography>

        {/* Subtitle (optional, usually contains signin/signup link) */}
        {subtitle && (
          <Typography
            variant="muted"
            className="mt-2 text-ui-text-tertiary"
          >
            {subtitle}
          </Typography>
        )}

        {/* Form content */}
        <div className="mt-8">
          {children}
        </div>
      </div>

      {/* Legal - fixed to bottom */}
      <Typography
        variant="caption"
        className="fixed bottom-8 left-0 right-0 text-center text-ui-text-tertiary"
      >
        <a
          href="/terms"
          className="underline hover:text-ui-text-secondary transition-colors"
        >
          Terms of Service
        </a>
        {" · "}
        <a
          href="/privacy"
          className="underline hover:text-ui-text-secondary transition-colors"
        >
          Privacy Policy
        </a>
      </Typography>
    </Flex>
  );
}
```

---

## signup.tsx - Target Code

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { AuthLink, AuthPageLayout, AuthRedirect, SignUpForm } from "@/components/auth";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/signup")({
  component: SignUpRoute,
  ssr: false,
});

function SignUpRoute() {
  return (
    <AuthRedirect>
      <AuthPageLayout
        title="Create your account"
        subtitle={
          <>
            Already have an account?{" "}
            <AuthLink to={ROUTES.signin.path}>Sign in →</AuthLink>
          </>
        }
      >
        <SignUpForm />
      </AuthPageLayout>
    </AuthRedirect>
  );
}
```

---

## SignUpForm.tsx - Key Changes

### 1. Hide step indicator in step 0

```tsx
// Current: Always shows step indicator
<Flex justify="center" gap="sm" className="mb-6">
  {[0, 1, 2].map((step) => ...)}
</Flex>

// Target: Only show when step >= 1
{currentStep > 0 && (
  <Flex justify="center" gap="sm" className="mb-6">
    {[0, 1, 2].map((step) => ...)}
  </Flex>
)}
```

### 2. Remove "already have account" text

This is now in `AuthPageLayout` subtitle - remove any duplicate.

### 3. Add aria-describedby for password hint

```tsx
<Input
  type="password"
  name="password"
  placeholder="Password"
  minLength={8}
  required={formReady}
  aria-describedby="password-hint"
/>
<Typography
  variant="caption"
  color="tertiary"
  className="-mt-2"
  id="password-hint"
>
  Must be at least 8 characters
</Typography>
```

---

## CSS Required

Add to `src/index.css` if not present:

```css
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
```

---

## States to Handle

### 1. Default State (Step 0)
- Form collapsed
- Google button + Email button visible
- No inputs visible
- **NO step indicator visible**

### 2. Email Expanded State (Step 1)
- Form expanded with email/password inputs
- Password hint visible below password field
- Step indicator appears (1/3 active)
- "Create account" primary button

### 3. Submitting State
```tsx
<Button disabled>
  <Spinner className="w-4 h-4 mr-2 animate-spin" />
  Creating account...
</Button>
```

### 4. Verification State (Step 2)
- Form replaced with OTP input
- Step indicator shows (2/3 active)
- Instructions for email check

### 5. Error State
```tsx
toast.error("Could not create account");
```

### 6. Success State
- Redirect to `/app`
- No visible success UI needed

---

## Error Handling

| Error | Display | Recovery |
|-------|---------|----------|
| Invalid email | Inline (HTML5) | User corrects |
| Password too short | Inline | User corrects |
| Email already registered | Toast | Redirect to signin |
| Network error | Toast | Retry |
| OAuth cancelled | Toast | Retry |
| Rate limited | Toast | Wait |
| Invalid OTP | Inline below OTP | User re-enters |
| OTP expired | Toast + auto-resend | Wait |

---

## Verification Checklist

### Structure
- [ ] No card wrapper (`card-subtle`, `shadow-card` removed)
- [ ] No "Back to Home" link
- [ ] Content max-width is 360px
- [ ] Legal text is single line at bottom
- [ ] Legal text is `position: fixed`
- [ ] "Sign in" link moved to subtitle

### Typography
- [ ] Heading is "Create your account"
- [ ] Heading is 24px, semibold, tracking-tight
- [ ] Subtitle contains signin link with arrow (→)
- [ ] Legal uses 12px caption variant
- [ ] Password hint is 12px, tertiary

### Spacing
- [ ] Logo to heading: 32px
- [ ] Heading to subtitle: 8px
- [ ] Subtitle to form: 32px
- [ ] Form elements: 12-16px gaps
- [ ] Legal: 32px from bottom

### Step Indicator
- [ ] Hidden in default state (step 0)
- [ ] Shows when email form expanded
- [ ] Correct colors (brand active, border inactive)
- [ ] Smooth width transition

### Animation
- [ ] Single fade-in animation (no stagger)
- [ ] Duration: 0.3s
- [ ] No individual element delays
- [ ] Form expand is smooth

### States
- [ ] Default: Shows Google + Email buttons, no step indicator
- [ ] Expanded: Shows email/password inputs, step indicator appears
- [ ] Submitting: Shows spinner, disabled inputs
- [ ] Verification: Shows OTP input, step 2 active
- [ ] Error: Toast notification

### Responsive
- [ ] Desktop: Centered, 360px max
- [ ] Tablet: Same as desktop
- [ ] Mobile: Full width - 32px padding

### Accessibility
- [ ] Heading has proper h1
- [ ] Form has aria-label
- [ ] Inputs have aria-required
- [ ] Password has aria-describedby
- [ ] Focus order is logical
- [ ] Color contrast passes AA

### Visual QA
- [ ] No visible card/container border
- [ ] Background is pure bg-ui-bg
- [ ] Mirrors signin page layout
- [ ] Would not embarrass us to Linear's team

---

## After Implementation

1. Run `pnpm screenshots` to regenerate current state
2. Compare `desktop-dark.png` with `reference-mintlify-desktop-dark.png`
3. Verify all checklist items
4. Update status in `DIRECTOR.md` from 🔴 to 🟢

---

## Notes

- **Shared Layout**: Fixing `AuthPageLayout.tsx` fixes signin, signup, AND forgot-password
- `SignUpForm.tsx` logic (expand/collapse, validation, verification) is fine - only layout changes
- Step indicator adds useful feedback for signup - but should only appear after user commits to email flow
- Verification flow (`EmailVerificationForm`) styling should match minimal aesthetic but is out of scope
