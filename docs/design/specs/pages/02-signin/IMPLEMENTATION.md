# Sign In Page - Implementation

> **Priority**: P0 - Auth Flow
> **Scope**: `AuthPageLayout.tsx` rewrite (fixes signin, signup, forgot-password)

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/auth/AuthPageLayout.tsx` | **REWRITE** | Remove card, back link, verbose legal, staggered animations |
| `src/routes/signin.tsx` | MODIFY | Update heading/subtitle props |
| `src/components/auth/SignInForm.tsx` | KEEP | Logic is fine, minimal styling tweaks |

---

## AuthPageLayout.tsx - Target Code

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

        {/* Subtitle (optional, usually contains signup/signin link) */}
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

## signin.tsx - Target Code

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { AuthLink, AuthPageLayout, AuthRedirect, SignInForm } from "@/components/auth";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/signin")({
  component: SignInRoute,
  ssr: false,
});

function SignInRoute() {
  return (
    <AuthRedirect>
      <AuthPageLayout
        title="Sign in to Nixelo"
        subtitle={
          <>
            Don't have an account?{" "}
            <AuthLink to={ROUTES.signup.path}>Sign up →</AuthLink>
          </>
        }
      >
        <SignInForm />
      </AuthPageLayout>
    </AuthRedirect>
  );
}
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

### 1. Default State
- Form collapsed
- Google button + Email button visible
- No inputs visible

### 2. Email Expanded State
- Form expanded with email/password inputs
- "Forgot password?" link visible
- Submit button replaces email button

### 3. Submitting State
```tsx
<Button disabled>
  <Spinner className="w-4 h-4 mr-2 animate-spin" />
  Signing in...
</Button>
```

### 4. Error State
```tsx
toast.error("Invalid credentials. Please try again.");
```

### 5. Success State
- Redirect to `/app`
- No visible success UI needed

---

## Error Handling

| Error | Display | Recovery |
|-------|---------|----------|
| Invalid email | Inline (HTML5) | User corrects |
| Invalid credentials | Toast | Retry |
| Network error | Toast | Retry |
| OAuth cancelled | Toast | Retry |
| Rate limited | Toast | Wait |

---

## Verification Checklist

### Structure
- [ ] No card wrapper (`card-subtle`, `shadow-card` removed)
- [ ] No "Back to Home" link
- [ ] Content max-width is 360px
- [ ] Legal text is single line at bottom
- [ ] Legal text is `position: fixed`

### Typography
- [ ] Heading is "Sign in to Nixelo"
- [ ] Heading is 24px, semibold, tracking-tight
- [ ] Subtitle contains signup link with arrow (→)
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

### States
- [ ] Default: Google + Email buttons
- [ ] Expanded: email/password inputs
- [ ] Submitting: spinner, disabled
- [ ] Error: toast notification

### Responsive
- [ ] Desktop: Centered, 360px max
- [ ] Tablet: Same as desktop
- [ ] Mobile: Full width - 32px padding

### Accessibility
- [ ] Heading has proper h1
- [ ] Form has aria-label
- [ ] Inputs have aria-required
- [ ] Focus order is logical
- [ ] Color contrast passes AA

### Visual QA
- [ ] No visible card/container border
- [ ] Background is pure bg-ui-bg
- [ ] Matches Mintlify reference
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
- `SignInForm.tsx` logic is fine - only layout needs changes
- Form expand/collapse animation should remain smooth
