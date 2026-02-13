# Sign Up Page - Execution Spec

> **Route**: `/signup`
> **Status**: 🔴 SLOP - Same issues as signin
> **Priority**: P0 - Auth Flow
> **Director Reference**: See `DIRECTOR.md` → `/signup`

---

## Executive Summary

The signup page shares `AuthPageLayout.tsx` with signin and inherits all its problems: card wrapper, "Back to Home" link, verbose legal text, staggered animations. Additionally, the signup-specific elements have their own issues.

**Target**: Minimal, confident, premium sign up. Mirrors signin layout exactly. Same principles, same execution.

---

## Current State

### Screenshots

All screenshots are in `./screenshots/`:

| Viewport | Theme | File | Preview |
|----------|-------|------|---------|
| Desktop | Dark | `desktop-dark.png` | ![](screenshots/desktop-dark.png) |
| Desktop | Light | `desktop-light.png` | ![](screenshots/desktop-light.png) |
| Tablet | Light | `tablet-light.png` | ![](screenshots/tablet-light.png) |
| Mobile | Light | `mobile-light.png` | ![](screenshots/mobile-light.png) |

### Reference (Mintlify)

| Viewport | Theme | File | Preview |
|----------|-------|------|---------|
| Desktop | Dark | `reference-mintlify-desktop-dark.png` | ![](screenshots/reference-mintlify-desktop-dark.png) |
| Desktop | Light | `reference-mintlify-desktop-light.png` | ![](screenshots/reference-mintlify-desktop-light.png) |
| Mobile | Dark | `reference-mintlify-mobile-dark.png` | ![](screenshots/reference-mintlify-mobile-dark.png) |

### Current Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/signup.tsx` | Route definition | 23 |
| `src/components/auth/AuthPageLayout.tsx` | Shared layout (THE PROBLEM) | 106 |
| `src/components/auth/SignUpForm.tsx` | Form logic + step indicator | 207 |
| `src/components/auth/GoogleAuthButton.tsx` | OAuth button | ~50 |
| `src/components/auth/AuthLink.tsx` | Styled link | ~20 |
| `src/components/auth/EmailVerificationForm.tsx` | OTP verification | ~100 |

### Current Structure (ASCII)

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
│         │           Create an account                 │   shadow-card       │
│         │     Sign up to get started with Nixelo      │                     │
│         │                                             │   SLOP: Kill card   │
│         │     [ ● ● ○ ]  ← Step indicator             │ ← Unnecessary here  │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │ G  Sign up with Google            │   │                     │
│         │     └───────────────────────────────────┘   │                     │
│         │                                             │                     │
│         │     ──────────── or ────────────            │                     │
│         │                                             │                     │
│         │     ┌───────────────────────────────────┐   │                     │
│         │     │ ✉  Continue with email            │   │ ← Expands to show   │
│         │     └───────────────────────────────────┘   │   email/password    │
│         │                                             │                     │
│         │     Already have an account? Sign in        │ ← In wrong place    │
│         │                                             │                     │
│         │     By continuing, you acknowledge that     │ ← SLOP: Too verbose │
│         │     you understand and agree to the         │                     │
│         │     Terms & Conditions and Privacy Policy   │                     │
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
| 5 | Step indicator shown before email expansion | `SignUpForm.tsx:101-111` | MEDIUM |
| 6 | "Already have account?" placed inside card | `signup.tsx:16-18` | MEDIUM |
| 7 | Generic subtitle | `signup.tsx:14` | LOW |
| 8 | Full logo (48px) could be smaller | `AuthPageLayout.tsx:57` | LOW |
| 9 | `max-w-md` (448px) slightly too wide | `AuthPageLayout.tsx:17` | LOW |
| 10 | Password hint styling inconsistent | `SignUpForm.tsx:154-156` | LOW |

---

## Target State

### Reference

| Source | Path |
|--------|------|
| Mintlify Signup (Dark) | `docs/research/library/mintlify/signup_desktop_dark.png` |
| Mintlify CSS Tokens | `docs/research/library/mintlify/signup_deep.json` |

### Target Structure (ASCII)

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
│                       Create your account                                   │
│                       ───────────────────                                   │
│                    (24px, font-semibold, white)                            │
│                                                                             │
│                  Already have an account? Sign in →                        │
│                    (14px, tertiary + brand link)                           │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ G  Continue with Google       │                        │
│                    └───────────────────────────────┘                        │
│                         (outlined, subtle border)                          │
│                                                                             │
│                    ──────────── or ────────────                            │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ ✉  Continue with email        │                        │
│                    └───────────────────────────────┘                        │
│                         (secondary variant)                                │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                    Terms of Service · Privacy Policy                       │
│                         (12px, tertiary, links)                            │
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
| Heading | "Create an account" | "Create your account" |
| Subtitle | Separate line | Inline with signin link |
| Signin link | Inside card, below form | Below heading |
| Step indicator | Always visible | Only after email expansion |
| Legal text | 3-line paragraph | Single line, bottom |
| Animations | 6 staggered | 1 fade-in |
| Max width | 448px (`max-w-md`) | 360px |

---

## Detailed Specifications

### Layout

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
│  │  │  [Google button]           48px height                        │   │   │
│  │  │      ↕ 16px (gap-4)                                           │   │   │
│  │  │  [Divider]                 20px height                        │   │   │
│  │  │      ↕ 16px (gap-4)                                           │   │   │
│  │  │  [Email button]            48px height                        │   │   │
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
| Google → Divider | gap | 16px | `gap-4` |
| Divider → Email | gap | 16px | `gap-4` |
| Email → Password | gap | 12px | `gap-3` |
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
| Legal | Inter | 12px | 400 | `text-ui-text-tertiary` | underline |

### Colors

| Element | Light Mode | Dark Mode | Token |
|---------|------------|-----------|-------|
| Background | `#ffffff` | `#08090a` | `bg-ui-bg` |
| Heading | `gray-900` | `#ffffff` | `text-ui-text` |
| Subtitle | `gray-400` | `rgba(255,255,255,0.5)` | `text-ui-text-tertiary` |
| Brand link | `indigo-600` | `indigo-400` | `text-brand` |
| Button bg (Google) | `transparent` | `transparent` | - |
| Button border | `gray-200` | `rgba(255,255,255,0.07)` | `border-ui-border` |
| Divider line | `gray-200` | `rgba(255,255,255,0.07)` | `border-ui-border` |
| Divider text | `gray-400` | `rgba(255,255,255,0.5)` | `text-ui-text-tertiary` |
| Step indicator (active) | `indigo-600` | `indigo-400` | `bg-brand` |
| Step indicator (inactive) | `gray-200` | `rgba(255,255,255,0.07)` | `bg-ui-border` |

### Buttons

#### Google OAuth Button

```tsx
<Button
  variant="outline"
  size="lg"
  className="w-full"
>
  <GoogleIcon className="w-5 h-5 mr-2" />
  Continue with Google
</Button>
```

| Property | Value |
|----------|-------|
| Height | 48px |
| Border radius | 8px (`rounded`) |
| Border | 1px `border-ui-border` |
| Background | transparent |
| Hover background | `bg-ui-bg-hover` |
| Text color | `text-ui-text` |
| Font size | 14px |
| Font weight | 500 |

#### Email Button (Collapsed)

```tsx
<Button
  variant="secondary"
  size="lg"
  className="w-full"
>
  <MailIcon className="w-5 h-5 mr-2" />
  Continue with email
</Button>
```

| Property | Value |
|----------|-------|
| Height | 48px |
| Border radius | 8px |
| Background | `bg-ui-bg-secondary` |
| Hover background | `bg-ui-bg-tertiary` |
| Text color | `text-ui-text` |

#### Create Account Button (Expanded)

```tsx
<Button
  variant="primary"
  size="lg"
  className="w-full"
>
  Create account
</Button>
```

| Property | Value |
|----------|-------|
| Height | 48px |
| Border radius | 8px |
| Background | `bg-brand` |
| Hover background | `bg-brand-hover` |
| Text color | `text-brand-foreground` |

### Form Fields (Expanded State)

When email form is expanded:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ ✉  email@example.com          │  ← Email input        │
│                    └───────────────────────────────┘                        │
│                         ↕ 12px                                              │
│                    ┌───────────────────────────────┐                        │
│                    │ ●●●●●●●●                      │  ← Password input     │
│                    └───────────────────────────────┘                        │
│                         ↕ 4px                                               │
│                    Must be at least 8 characters      ← Password hint       │
│                         ↕ 16px                                              │
│                    ┌───────────────────────────────┐                        │
│                    │       Create account          │  ← Primary button     │
│                    └───────────────────────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Input Fields

| Property | Value |
|----------|-------|
| Height | 48px |
| Border radius | 8px |
| Border | 1px `border-ui-border` |
| Background | `bg-ui-bg` (transparent in dark) |
| Placeholder color | `text-ui-text-tertiary` |
| Focus border | `border-brand` |
| Focus ring | `ring-2 ring-brand/20` |
| Padding | 12px 16px |
| Font size | 14px |

### Step Indicator

Show step indicator ONLY when email form is expanded (step >= 1):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     Step 0 (default):       No indicator visible                            │
│                                                                             │
│     Step 1 (email form):    [ ●━━━━ ○━━━━ ○ ]                              │
│                              Form   Verify  Done                            │
│                                                                             │
│     Step 2 (verification):  [ ●━━━━ ●━━━━ ○ ]                              │
│                              Form   Verify  Done                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Indicator height | 6px (h-1.5) |
| Active width | 32px (w-8) |
| Inactive width | 16px (w-4) |
| Border radius | pill |
| Active color | `bg-brand` |
| Inactive color | `bg-ui-border` |
| Gap between | 8px (gap-2) |
| Position | Above form, centered |
| Margin below | 24px (mb-6) |

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

#### Form Expand

When clicking "Continue with email":

```css
.form-fields {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 0.2s ease-out, opacity 0.2s ease-out;
}

.form-fields.expanded {
  grid-template-rows: 1fr;
  opacity: 1;
}
```

| Property | Value |
|----------|-------|
| Duration | 0.2s |
| Easing | ease-out |
| Properties | grid-template-rows, opacity |

#### Step Indicator

```css
.step-indicator {
  transition: width 0.3s ease-out, background-color 0.3s ease-out;
}
```

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

#### 1. Default State (Step 0)

- Form collapsed
- Google button and Email button visible
- No inputs visible
- NO step indicator visible

#### 2. Email Expanded State (Step 1)

- Form expanded with email/password inputs
- Email button becomes "Create account" primary button
- Password hint visible below password field
- Step indicator appears (1/3 active)

#### 3. Submitting State

- Button shows spinner + "Creating account..."
- All inputs disabled
- Button disabled

```tsx
<Button disabled>
  <Spinner className="w-4 h-4 mr-2 animate-spin" />
  Creating account...
</Button>
```

#### 4. Verification State (Step 2)

- Form replaced with OTP input
- Step indicator shows (2/3 active)
- Instructions for email check

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    [ ●━━━━ ●━━━━ ○ ]                                       │
│                                                                             │
│                    Check your email                                         │
│                    (24px, semibold)                                         │
│                                                                             │
│                    We sent a code to user@example.com                       │
│                    (14px, tertiary)                                         │
│                                                                             │
│                    ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐                                │
│                    │ │ │ │ │ │ │ │ │ │ │ │  ← 6-digit OTP                  │
│                    └─┘ └─┘ └─┘ └─┘ └─┘ └─┘                                │
│                                                                             │
│                    Didn't receive? Resend                                   │
│                    (12px, tertiary + brand link)                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5. Error State

- Toast notification for registration errors
- Inputs remain enabled
- Form values preserved

```tsx
toast.error("Could not create account");
```

#### 6. Success State

- Immediate redirect to `/app`
- No visible success state needed

### Error Handling

| Error | Display | Recovery |
|-------|---------|----------|
| Invalid email format | Inline below input (HTML5 validation) | User corrects |
| Password too short | Inline below input | User corrects |
| Email already registered | Toast: "An account with this email already exists" | Redirect to signin |
| Network error | Toast: "Connection failed. Please try again." | Retry |
| OAuth cancelled | Toast: "Sign up cancelled" | Retry |
| Rate limited | Toast: "Too many attempts. Please wait." | Wait |
| Invalid OTP | Inline below OTP input | User re-enters |
| OTP expired | Toast: "Code expired. We sent a new one." | Auto-resend |

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

#### Focus Order

1. Logo (link to home)
2. "Sign in" link
3. Google button
4. Email button / Email input (when expanded)
5. Password input (when expanded)
6. Submit button (when expanded)
7. OTP inputs (when in verification state)
8. Resend link (when in verification state)
9. Terms link
10. Privacy link

#### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous focusable element |
| Enter | Submit form / Click focused button |
| Escape | No action (form stays) |

#### Screen Reader

```tsx
<main aria-labelledby="signup-heading">
  <h1 id="signup-heading">Create your account</h1>
  ...
</main>
```

#### ARIA Attributes

| Element | Attribute | Value |
|---------|-----------|-------|
| Form | `aria-label` | "Sign up form" |
| Email input | `aria-required` | "true" |
| Password input | `aria-required` | "true" |
| Password input | `aria-describedby` | "password-hint" |
| Password hint | `id` | "password-hint" |
| Submit button | `aria-busy` | "true" when submitting |
| Error toast | `role` | "alert" |
| OTP input group | `aria-label` | "Verification code" |

#### Color Contrast

| Element | Foreground | Background | Ratio | Pass |
|---------|------------|------------|-------|------|
| Heading (dark) | #ffffff | #08090a | 21:1 | ✓ AAA |
| Subtitle (dark) | rgba(255,255,255,0.5) | #08090a | 7.5:1 | ✓ AAA |
| Brand link (dark) | indigo-400 | #08090a | 5.2:1 | ✓ AA |
| Button text | #ffffff | indigo-600 | 8.1:1 | ✓ AAA |
| Password hint (dark) | rgba(255,255,255,0.5) | #08090a | 7.5:1 | ✓ AAA |

---

## Implementation

### Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/auth/AuthPageLayout.tsx` | REWRITE | Remove card, back link, verbose legal, staggered animations |
| `src/routes/signup.tsx` | MODIFY | Update heading, move signin link to subtitle prop |
| `src/components/auth/SignUpForm.tsx` | MODIFY | Hide step indicator in step 0, styling tweaks |

### AuthPageLayout.tsx - Target Code

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

### signup.tsx - Target Code

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

### SignUpForm.tsx - Key Changes

1. **Hide step indicator in step 0**:

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

2. **Remove any Typography with `variant="muted"` for the "already have account" text** - this is now in `AuthPageLayout` subtitle.

3. **Add aria-describedby for password hint**:

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

## Verification Checklist

### Structure

- [ ] No card wrapper (`card-subtle`, `shadow-card` removed)
- [ ] No "Back to Home" link
- [ ] Content max-width is 360px
- [ ] Legal text is single line at bottom
- [ ] Legal text is fixed positioned
- [ ] "Sign in" link moved to subtitle

### Typography

- [ ] Heading is "Create your account"
- [ ] Heading is 24px, semibold, tracking-tight
- [ ] Subtitle contains signin link with arrow
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

## Reference Screenshots

All screenshots are co-located in `./screenshots/`:

| Type | File |
|------|------|
| **Current (Before)** | `desktop-dark.png`, `desktop-light.png`, `tablet-light.png`, `mobile-light.png` |
| **Reference (Mintlify)** | `reference-mintlify-desktop-dark.png`, `reference-mintlify-desktop-light.png`, `reference-mintlify-mobile-dark.png` |
| **Expected (After)** | Regenerate with `pnpm screenshots` after implementation |

---

## Notes

- **Shared Layout**: Fixing `AuthPageLayout.tsx` once fixes both signin and signup pages
- The `SignUpForm.tsx` logic (expand/collapse, validation, verification flow) is fine and should be preserved
- Same pattern applies to `/forgot-password` - it also uses `AuthPageLayout`
- Step indicator adds useful feedback for signup specifically - but should only appear after user commits to email flow
- Verification flow (`EmailVerificationForm`) styling should match the minimal aesthetic but is out of scope for this spec
