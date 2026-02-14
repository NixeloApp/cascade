# Forgot Password Page - Implementation

> **Priority**: P0 - Auth Flow
> **Scope**: Shares `AuthPageLayout.tsx` with signin/signup (fixes all)

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/auth/AuthPageLayout.tsx` | **REWRITE** | Remove card, back link, verbose legal, staggered animations |
| `src/routes/forgot-password.tsx` | MODIFY | Update heading, move signin link to subtitle, consolidate forms |
| `src/components/auth/ResetPasswordForm.tsx` | MODIFY | Add password hint, minor styling tweaks |
| `src/components/auth/ForgotPasswordForm.tsx` | **DELETE** | Unused, logic is in route file |

---

## AuthPageLayout.tsx - Target Code

**NOTE**: This is the SAME as signin/signup - fixing AuthPageLayout fixes ALL auth pages.

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

        {/* Subtitle (optional) */}
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

## forgot-password.tsx - Target Code

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLink, AuthPageLayout, AuthRedirect, ResetPasswordForm } from "@/components/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form/Input";
import { ROUTES } from "@/config/routes";
import { getConvexSiteUrl } from "@/lib/convex";
import { TEST_IDS } from "@/lib/test-ids";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordRoute,
  ssr: false,
});

function ForgotPasswordRoute() {
  return (
    <AuthRedirect>
      <ForgotPasswordPage />
    </AuthRedirect>
  );
}

function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get("email") as string;

    try {
      await fetch(`${getConvexSiteUrl()}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formEmail }),
      });
    } catch {
      // Ignore network errors
    }

    setEmail(formEmail);
    setShowReset(true);
    toast.success("If an account exists, you'll receive a reset code");
    setSubmitting(false);
  };

  if (showReset) {
    return (
      <AuthPageLayout
        title="Check your email"
        subtitle={<>We sent a code to <strong>{email}</strong></>}
      >
        <ResetPasswordForm
          email={email}
          onSuccess={() => navigate({ to: ROUTES.app.path })}
          onRetry={() => {
            setShowReset(false);
            setEmail("");
          }}
        />
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title="Reset your password"
      subtitle={
        <>
          Remember your password?{" "}
          <AuthLink to={ROUTES.signin.path}>Sign in →</AuthLink>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          type="email"
          name="email"
          placeholder="Email"
          required
          data-testid={TEST_IDS.AUTH.EMAIL_INPUT}
        />
        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send reset code"}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
```

---

## ResetPasswordForm.tsx - Key Changes

Add password hint with proper accessibility:

```tsx
<Input
  type="password"
  name="newPassword"
  placeholder="New password"
  required
  minLength={8}
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

### Step 1: Email Entry

#### 1a. Default State
- Email input empty
- Submit button enabled
- Signin link visible in subtitle

#### 1b. Submitting State
```tsx
<Button disabled>
  Sending...
</Button>
```

#### 1c. Success State
- Toast: "If an account exists, you'll receive a reset code"
- Transition to Step 2

### Step 2: Code + New Password

#### 2a. Default State
- Code input empty
- Password input empty
- Submit button enabled
- Email shown in subtitle

#### 2b. Submitting State
```tsx
<Button disabled>
  Resetting...
</Button>
```

#### 2c. Success State
- Toast: "Password reset successfully!"
- Redirect to `/app`

#### 2d. Error State
```tsx
toast.error("Invalid code or password. Please try again.");
```

#### 2e. Retry State
- User clicks "Try again" link
- Returns to Step 1
- Email cleared

---

## Error Handling

| Error | Display | Recovery |
|-------|---------|----------|
| Invalid email | Inline (HTML5) | User corrects |
| Network error | Toast | Retry |
| Invalid code | Toast | User re-enters |
| Code expired | Toast | Back to step 1 |
| Password too short | Inline | User corrects |

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
- [ ] Heading (step 1) is "Reset your password"
- [ ] Heading (step 2) is "Check your email"
- [ ] Headings are 24px, semibold, tracking-tight
- [ ] Subtitle contains signin link with arrow (→) in step 1
- [ ] Subtitle shows email address in step 2
- [ ] Legal uses 12px caption variant

### Spacing
- [ ] Logo to heading: 32px
- [ ] Heading to subtitle: 8px
- [ ] Subtitle to form: 32px
- [ ] Form elements: 16px gaps
- [ ] Legal: 32px from bottom

### Animation
- [ ] Single fade-in animation (no stagger)
- [ ] Duration: 0.3s
- [ ] No individual element delays
- [ ] Step transition is simple fade-in

### States
- [ ] Step 1: Email input + submit button
- [ ] Step 2: Code input + password input + submit button
- [ ] Submitting: Shows loading text, disabled inputs
- [ ] Error: Toast notification
- [ ] Success: Toast + redirect

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
- [ ] Mirrors signin/signup page layout
- [ ] Would not embarrass us to Linear's team

### Cleanup
- [ ] Delete unused `ForgotPasswordForm.tsx`

---

## After Implementation

1. Run `pnpm screenshots` to regenerate current state
2. Compare `desktop-dark.png` with `reference-mintlify-desktop-dark.png`
3. Verify all checklist items
4. Update status in `DIRECTOR.md` from 🔴 to 🟢

---

## Notes

- **Shared Layout**: Fixing `AuthPageLayout.tsx` once fixes ALL auth pages
- Two-step flow (email → code + password) is correct and should be preserved
- Security: Always return success for email submission (prevents email enumeration)
- `ForgotPasswordForm.tsx` is legacy/unused - delete it
- "Try again" link should return to step 1 and clear email state
