# Forgot Password Page - Execution Spec

> **Route**: `/forgot-password`
> **Status**: 🔴 SLOP - Same issues as signin/signup
> **Priority**: P0 - Auth Flow
> **Director Reference**: See `DIRECTOR.md` → `/forgot-password`

---

## Executive Summary

The forgot password page uses `AuthPageLayout.tsx` and inherits all its problems: card wrapper, "Back to Home" link, verbose legal text, staggered animations. The page itself is simpler than signin/signup (just email input + submit), but the layout issues persist.

**Target**: Minimal, confident password reset flow. Mirrors signin/signup layout. Same principles, same execution.

---

## Current State

### Screenshots

| Viewport | Theme | Path |
|----------|-------|------|
| Desktop | Dark | `e2e/screenshots/desktop-dark-*-forgot-password.png` |
| Desktop | Light | `e2e/screenshots/desktop-light-*-forgot-password.png` |
| Tablet | Light | `e2e/screenshots/tablet-light-*-forgot-password.png` |
| Mobile | Light | `e2e/screenshots/mobile-light-*-forgot-password.png` |

### Current Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/forgot-password.tsx` | Route + form logic | 99 |
| `src/components/auth/AuthPageLayout.tsx` | Shared layout (THE PROBLEM) | 106 |
| `src/components/auth/ForgotPasswordForm.tsx` | Unused legacy form | 62 |
| `src/components/auth/ResetPasswordForm.tsx` | Code + new password form | 70 |
| `src/components/auth/AuthLink.tsx` | Styled link/button | ~30 |

### Current Structure (ASCII)

#### Step 1: Email Entry

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     bg: bg-ui-bg (white in light, #08090a in dark)                         │
│                                                                             │
│         ← Back to Home                    ← SLOP: Delete this              │
│                                                                             │
│         ┌─────────────────────────────────────────────┐                     │
│         │                                             │                     │
│         │              [Nixelo Logo 48px]             │ ← card-subtle       │
│         │                                             │   p-8              │
│         │           Forgot password?                  │   shadow-card       │
│         │     Enter your email and we'll send you     │                     │
│         │              a reset code                   │   SLOP: Kill card   │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │ ✉  Email                          │   │                     │
│         │     └───────────────────────────────────┘   │                     │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │        Send reset code            │   │                     │
│         │     └───────────────────────────────────┘   │                     │
│         │                                             │                     │
│         │         Back to sign in                     │ ← Should be below   │
│         │                                             │   heading, not form │
│         │     By continuing, you acknowledge that     │ ← SLOP: Too verbose │
│         │     you understand and agree to the         │                     │
│         │     Terms & Conditions and Privacy Policy   │                     │
│         │                                             │                     │
│         └─────────────────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Step 2: Code Entry + New Password

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│         ← Back to Home                                                      │
│                                                                             │
│         ┌─────────────────────────────────────────────┐                     │
│         │                                             │                     │
│         │              [Nixelo Logo 48px]             │                     │
│         │                                             │                     │
│         │            Reset password                   │                     │
│         │     Enter the code from your email          │                     │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │  8-digit code                     │   │                     │
│         │     └───────────────────────────────────┘   │                     │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │  New password                     │   │                     │
│         │     └───────────────────────────────────┘   │                     │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │        Reset password             │   │                     │
│         │     └───────────────────────────────────┘   │                     │
│         │                                             │                     │
│         │     Didn't receive a code? Try again        │                     │
│         │                                             │                     │
│         │     [Legal text...]                         │                     │
│         │                                             │                     │
│         └─────────────────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Current Problems (Itemized)

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Card wrapper (`card-subtle p-8 shadow-card`) | `AuthPageLayout.tsx:47` | HIGH |
| 2 | "Back to Home" link with arrow | `AuthPageLayout.tsx:19-44` | HIGH |
| 3 | Verbose legal text (3 lines) | `AuthPageLayout.tsx:83-100` | MEDIUM |
| 4 | 6 staggered animations (0.05s - 0.4s delays) | `AuthPageLayout.tsx` throughout | MEDIUM |
| 5 | "Back to sign in" placed below form | `forgot-password.tsx:93-95` | MEDIUM |
| 6 | Full logo (48px) could be smaller | `AuthPageLayout.tsx:57` | LOW |
| 7 | `max-w-md` (448px) slightly too wide | `AuthPageLayout.tsx:17` | LOW |
| 8 | Unused `ForgotPasswordForm.tsx` component | `components/auth/` | LOW |

---

## Target State

### Reference

| Source | Path |
|--------|------|
| Mintlify Signup (Dark) | `docs/research/library/mintlify/signup_desktop_dark.png` |
| Mintlify CSS Tokens | `docs/research/library/mintlify/signup_deep.json` |

### Target Structure (ASCII)

#### Step 1: Email Entry

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     bg: bg-ui-bg (#08090a dark / white light)                              │
│                                                                             │
│     NO card. NO back link. Content floats.                                 │
│                                                                             │
│                                                                             │
│                                                                             │
│                              [N]                                            │
│                         (Logo, 32px)                                        │
│                                                                             │
│                                                                             │
│                       Reset your password                                   │
│                       ───────────────────                                   │
│                    (24px, font-semibold, white)                            │
│                                                                             │
│                    Remember your password? Sign in →                       │
│                    (14px, tertiary + brand link)                           │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ ✉  Email                      │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │       Send reset code         │                        │
│                    └───────────────────────────────┘                        │
│                         (primary variant)                                  │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                    Terms of Service · Privacy Policy                       │
│                         (12px, tertiary, links)                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Step 2: Code Entry + New Password

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     bg: bg-ui-bg (#08090a dark / white light)                              │
│                                                                             │
│                                                                             │
│                                                                             │
│                              [N]                                            │
│                         (Logo, 32px)                                        │
│                                                                             │
│                                                                             │
│                       Check your email                                      │
│                       ────────────────                                      │
│                    (24px, font-semibold, white)                            │
│                                                                             │
│                    We sent a code to user@example.com                       │
│                    (14px, tertiary)                                         │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │  8-digit code                 │                        │
│                    └───────────────────────────────┘                        │
│                         ↕ 12px                                              │
│                    ┌───────────────────────────────┐                        │
│                    │  New password                 │                        │
│                    └───────────────────────────────┘                        │
│                         ↕ 4px                                               │
│                    Must be at least 8 characters                            │
│                         ↕ 16px                                              │
│                    ┌───────────────────────────────┐                        │
│                    │       Reset password          │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                    Didn't receive? Try again                                │
│                    (12px, tertiary + brand link)                           │
│                                                                             │
│                                                                             │
│                    Terms of Service · Privacy Policy                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Differences

| Aspect | Current | Target |
|--------|---------|--------|
| Background | Pure bg-ui-bg | Same ✓ |
| Card wrapper | Yes (`card-subtle`) | **NO** |
| Back link | Yes | **NO** |
| Logo size | 48px | 32px |
| Heading (step 1) | "Forgot password?" | "Reset your password" |
| Subtitle | Generic | Inline with signin link |
| Signin link | Below form | Below heading |
| Heading (step 2) | "Reset password" | "Check your email" |
| Legal text | 3-line paragraph | Single line, bottom |
| Animations | 6 staggered | 1 fade-in |
| Max width | 448px (`max-w-md`) | 360px |

---

## Detailed Specifications

### Layout (Step 1: Email Entry)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MEASUREMENTS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Viewport ──────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │                        ↕ flexible (centers content)                  │   │
│  │                                                                      │   │
│  │  ┌─ Content Container (max-w-[360px] mx-auto) ──────────────────┐   │   │
│  │  │                                                               │   │   │
│  │  │  [Logo]                    32px height                        │   │   │
│  │  │      ↕ 32px (gap-8)                                           │   │   │
│  │  │  [Heading]                 30px line-height                   │   │   │
│  │  │      ↕ 8px (gap-2)                                            │   │   │
│  │  │  [Subtitle + link]         20px line-height                   │   │   │
│  │  │      ↕ 32px (gap-8)                                           │   │   │
│  │  │  [Email input]             48px height                        │   │   │
│  │  │      ↕ 16px (gap-4)                                           │   │   │
│  │  │  [Submit button]           48px height                        │   │   │
│  │  │                                                               │   │   │
│  │  └───────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │                        ↕ flexible                                    │   │
│  │                                                                      │   │
│  │  ┌─ Legal (fixed to bottom, pb-8) ──────────────────────────────┐   │   │
│  │  │  Terms of Service · Privacy Policy                            │   │   │
│  │  └───────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Spacing Values (Exact)

| Element | Property | Value | Tailwind |
|---------|----------|-------|----------|
| Page | padding | 16px | `p-4` |
| Content | max-width | 360px | `max-w-[360px]` |
| Content | horizontal | centered | `mx-auto` |
| Logo → Heading | gap | 32px | `gap-8` or `mb-8` |
| Heading → Subtitle | gap | 8px | `gap-2` or `mb-2` |
| Subtitle → Form | gap | 32px | `gap-8` or `mt-8` |
| Email → Button | gap | 16px | `gap-4` |
| Code → Password | gap | 12px | `gap-3` |
| Password → Hint | gap | 4px | `-mt-2` (negative to tighten) |
| Legal | position | fixed bottom | `fixed bottom-0` |
| Legal | padding-bottom | 32px | `pb-8` |

### Typography

| Element | Font | Size | Weight | Color | Tracking |
|---------|------|------|--------|-------|----------|
| Heading | Inter | 24px | 600 | `text-ui-text` | -0.24px |
| Subtitle | Inter | 14px | 400 | `text-ui-text-tertiary` | normal |
| Signin link | Inter | 14px | 500 | `text-brand` | normal |
| Button text | Inter | 14px | 500 | varies | normal |
| Password hint | Inter | 12px | 400 | `text-ui-text-tertiary` | normal |
| Retry link | Inter | 12px | 400 | `text-ui-text-tertiary` | normal |
| Legal | Inter | 12px | 400 | `text-ui-text-tertiary` | underline |

### Colors

| Element | Light Mode | Dark Mode | Token |
|---------|------------|-----------|-------|
| Background | `#ffffff` | `#08090a` | `bg-ui-bg` |
| Heading | `gray-900` | `#ffffff` | `text-ui-text` |
| Subtitle | `gray-400` | `rgba(255,255,255,0.5)` | `text-ui-text-tertiary` |
| Brand link | `indigo-600` | `indigo-400` | `text-brand` |
| Button bg | `indigo-600` | `indigo-500` | `bg-brand` |
| Input border | `gray-200` | `rgba(255,255,255,0.07)` | `border-ui-border` |

### Buttons

#### Send Reset Code Button (Step 1)

```tsx
<Button
  variant="primary"
  size="lg"
  className="w-full"
>
  Send reset code
</Button>
```

| Property | Value |
|----------|-------|
| Height | 48px |
| Border radius | 8px |
| Background | `bg-brand` |
| Hover background | `bg-brand-hover` |
| Text color | `text-brand-foreground` |

#### Reset Password Button (Step 2)

```tsx
<Button
  variant="primary"
  size="lg"
  className="w-full"
>
  Reset password
</Button>
```

Same specs as above.

### Form Fields

#### Email Input (Step 1)

| Property | Value |
|----------|-------|
| Height | 48px |
| Border radius | 8px |
| Border | 1px `border-ui-border` |
| Background | `bg-ui-bg` (transparent in dark) |
| Placeholder | "Email" |
| Focus border | `border-brand` |
| Focus ring | `ring-2 ring-brand/20` |

#### Code Input (Step 2)

| Property | Value |
|----------|-------|
| Height | 48px |
| Border radius | 8px |
| Placeholder | "8-digit code" |
| Pattern | `[0-9]{8}` |
| Max length | 8 |
| Input mode | `numeric` |

#### New Password Input (Step 2)

| Property | Value |
|----------|-------|
| Height | 48px |
| Border radius | 8px |
| Placeholder | "New password" |
| Min length | 8 |
| Type | `password` |
| aria-describedby | "password-hint" |

### Animations

#### Page Enter

Single animation for entire content block:

```css
@keyframes auth-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-content {
  animation: auth-enter 0.3s ease-out;
}
```

| Property | Value |
|----------|-------|
| Name | `auth-enter` |
| Duration | 0.3s |
| Easing | ease-out |
| Transform | translateY(8px → 0) |
| Opacity | 0 → 1 |

**NO staggered animations.** One animation, entire block.

#### Step Transition

When transitioning from step 1 to step 2:

```css
.step-content {
  animation: auth-enter 0.3s ease-out;
}
```

Same fade-in as page enter. Simple, not fancy.

#### Button States

```css
button {
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}

button:active {
  transform: scale(0.98);
}
```

### States

#### Step 1: Email Entry

##### 1a. Default State

- Email input empty
- Submit button enabled
- Signin link visible in subtitle

##### 1b. Submitting State

- Button shows "Sending..."
- Email input disabled
- Button disabled

```tsx
<Button disabled>
  Sending...
</Button>
```

##### 1c. Success State

- Toast: "If an account exists, you'll receive a reset code"
- Transition to Step 2

#### Step 2: Code + New Password

##### 2a. Default State

- Code input empty
- Password input empty
- Submit button enabled
- Email shown in subtitle

##### 2b. Submitting State

- Button shows "Resetting..."
- All inputs disabled
- Button disabled

```tsx
<Button disabled>
  Resetting...
</Button>
```

##### 2c. Success State

- Toast: "Password reset successfully!"
- Redirect to `/app`

##### 2d. Error State

- Toast: "Invalid code or password. Please try again."
- Inputs remain enabled
- Form values preserved

##### 2e. Retry State

- User clicks "Try again" link
- Returns to Step 1
- Email cleared

### Error Handling

| Error | Display | Recovery |
|-------|---------|----------|
| Invalid email format | Inline below input (HTML5 validation) | User corrects |
| Network error | Toast: "Connection failed. Please try again." | Retry |
| Invalid code | Toast: "Invalid code or password. Please try again." | User re-enters |
| Code expired | Toast: "Code expired. Please request a new one." | Back to step 1 |
| Password too short | Inline below input | User corrects |

### Responsive Behavior

#### Desktop (1200px+)

- Content centered horizontally and vertically
- Max width 360px

#### Tablet (768px - 1199px)

- Same as desktop
- Touch targets already 48px (adequate)

#### Mobile (< 768px)

- Same layout, content still centered
- Full width minus padding (360px or 100% - 32px, whichever smaller)
- Legal text may wrap to 2 lines (acceptable)

```tsx
<div className="w-full max-w-[360px] px-4">
```

### Accessibility

#### Focus Order (Step 1)

1. Logo (link to home)
2. "Sign in" link
3. Email input
4. Submit button
5. Terms link
6. Privacy link

#### Focus Order (Step 2)

1. Logo (link to home)
2. Code input
3. Password input
4. Submit button
5. "Try again" link
6. Terms link
7. Privacy link

#### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous focusable element |
| Enter | Submit form |
| Escape | No action |

#### Screen Reader

```tsx
<main aria-labelledby="forgot-heading">
  <h1 id="forgot-heading">Reset your password</h1>
  ...
</main>
```

#### ARIA Attributes

| Element | Attribute | Value |
|---------|-----------|-------|
| Form | `aria-label` | "Password reset form" |
| Email input | `aria-required` | "true" |
| Code input | `aria-required` | "true" |
| Password input | `aria-required` | "true" |
| Password input | `aria-describedby` | "password-hint" |
| Submit button | `aria-busy` | "true" when submitting |
| Error toast | `role` | "alert" |

#### Color Contrast

| Element | Foreground | Background | Ratio | Pass |
|---------|------------|------------|-------|------|
| Heading (dark) | #ffffff | #08090a | 21:1 | ✓ AAA |
| Subtitle (dark) | rgba(255,255,255,0.5) | #08090a | 7.5:1 | ✓ AAA |
| Brand link (dark) | indigo-400 | #08090a | 5.2:1 | ✓ AA |
| Button text | #ffffff | indigo-600 | 8.1:1 | ✓ AAA |

---

## Implementation

### Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/auth/AuthPageLayout.tsx` | REWRITE | Remove card, back link, verbose legal, staggered animations |
| `src/routes/forgot-password.tsx` | MODIFY | Update heading, move signin link to subtitle, consolidate forms |
| `src/components/auth/ResetPasswordForm.tsx` | MODIFY | Add password hint, minor styling tweaks |
| `src/components/auth/ForgotPasswordForm.tsx` | DELETE | Unused, logic is in route file |

### AuthPageLayout.tsx - Target Code

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

### forgot-password.tsx - Target Code

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

### ResetPasswordForm.tsx - Key Changes

```tsx
// Add password hint with proper accessibility
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

## Verification Checklist

### Structure

- [ ] No card wrapper (`card-subtle`, `shadow-card` removed)
- [ ] No "Back to Home" link
- [ ] Content max-width is 360px
- [ ] Legal text is single line at bottom
- [ ] Legal text is fixed positioned
- [ ] "Sign in" link moved to subtitle

### Typography

- [ ] Heading (step 1) is "Reset your password"
- [ ] Heading (step 2) is "Check your email"
- [ ] Headings are 24px, semibold, tracking-tight
- [ ] Subtitle contains signin link with arrow (step 1)
- [ ] Subtitle shows email address (step 2)
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

## Reference Screenshots

### Target (Mintlify)

```
docs/research/library/mintlify/signup_desktop_dark.png
```

### Current (Nixelo) - Before

```
e2e/screenshots/desktop-dark-*-forgot-password.png
```

### Expected (Nixelo) - After

After implementation, regenerate screenshots with `pnpm screenshots` and verify against target.

---

## Notes

- **Shared Layout**: Fixing `AuthPageLayout.tsx` once fixes ALL auth pages (signin, signup, forgot-password)
- The two-step flow (email → code + password) is correct and should be preserved
- Security note: Always return success for email submission to prevent email enumeration
- `ForgotPasswordForm.tsx` is legacy and unused - the form logic is directly in the route file. Delete it.
- The "Try again" link should return to step 1 and clear the email state
