# Verify Email Page - Implementation

> **Priority**: P1 - Auth Flow Enhancement
> **Dependencies**: None (new page)

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/routes/verify-email.tsx` | **CREATE** | New route for email verification page |
| `src/components/auth/SignInForm.tsx` | MODIFY | Navigate to verify-email after email submit |
| `convex/auth.ts` | CHECK | May need resend functionality |

---

## verify-email.tsx - Target Code

```tsx
import { api } from "@convex/_generated/api";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Mail, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthLink, AuthPageLayout, AuthRedirect } from "@/components/auth";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { showError, showSuccess } from "@/lib/toast";

interface VerifyEmailSearch {
  email?: string;
}

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  beforeLoad: ({ search }) => {
    // Redirect if no email provided
    if (!search.email) {
      throw redirect({ to: ROUTES.signin.path });
    }
  },
  component: VerifyEmailRoute,
  ssr: false,
});

const COUNTDOWN_SECONDS = 120;

function VerifyEmailRoute() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  // TODO: Hook up to actual resend mutation when available
  // const resendEmail = useMutation(api.auth.resendMagicLink);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      // TODO: Call actual resend mutation
      // await resendEmail({ email });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Placeholder
      showSuccess("Email sent! Check your inbox.");
      setCountdown(COUNTDOWN_SECONDS);
    } catch (error) {
      showError(error, "Failed to resend email");
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    navigate({ to: ROUTES.signin.path });
  };

  const canResend = countdown === 0 && !isResending;

  return (
    <AuthRedirect>
      <AuthPageLayout title="Check your inbox">
        <Flex direction="column" align="center" className="text-center">
          {/* Mail Icon */}
          <Flex
            align="center"
            justify="center"
            className="w-16 h-16 rounded-full bg-ui-bg-secondary mb-6"
          >
            <Icon icon={Mail} size="lg" className="text-ui-text-secondary" />
          </Flex>

          {/* Subtitle with email */}
          <Typography variant="muted" className="mb-8">
            We sent a sign-in link to{" "}
            <strong className="font-semibold text-ui-text">{email}</strong>
          </Typography>

          {/* Resend Button */}
          <Button
            variant="secondary"
            onClick={handleResend}
            disabled={!canResend}
            className="w-full mb-4"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend email ({formatCountdown(countdown)})
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend email
              </>
            )}
          </Button>

          {/* Change Email Link */}
          <AuthLink to={ROUTES.signin.path}>
            Use a different email →
          </AuthLink>
        </Flex>
      </AuthPageLayout>
    </AuthRedirect>
  );
}
```

---

## SignInForm.tsx Modification

After successful email submission, navigate to verify-email:

```tsx
// In handleEmailSubmit or similar function:
navigate({
  to: "/verify-email",
  search: { email: submittedEmail },
});
```

---

## Verification Checklist

### Structure
- [ ] No card wrapper (matches signin/signup)
- [ ] Content max-width is 360px
- [ ] Mail icon centered in circular bg
- [ ] Email address displayed and bolded

### Typography
- [ ] Heading is "Check your inbox"
- [ ] Heading is 24px, semibold
- [ ] Email is bold within secondary text
- [ ] Countdown uses tertiary color

### States
- [ ] Initial: countdown active, button disabled
- [ ] Countdown zero: button enabled
- [ ] Resending: spinner, disabled
- [ ] Success: toast, countdown reset
- [ ] No email param: redirect to signin

### Countdown
- [ ] Starts at 2:00
- [ ] Updates every second
- [ ] Format is M:SS
- [ ] Resets after successful resend

### Accessibility
- [ ] Focus order: logo → button → link
- [ ] Button has aria-disabled when countdown active
- [ ] Icon has aria-hidden

### Navigation
- [ ] "Use different email" goes to /signin
- [ ] Logo goes to home
- [ ] Redirect if no email param

---

## After Implementation

1. Run `pnpm screenshots` to capture new page
2. Update DIRECTOR.md status from 🔴 to 🟢
3. Test magic link flow end-to-end
4. Verify resend rate limiting works
