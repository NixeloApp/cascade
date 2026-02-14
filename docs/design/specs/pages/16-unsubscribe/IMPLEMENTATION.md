# Unsubscribe Page - Implementation

> **Priority**: P2 - Enhancement
> **Scope**: Simplify existing component, use AuthPageLayout

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/UnsubscribePage.tsx` | REWRITE | Use AuthPageLayout, remove card, simplify text |
| `src/routes/unsubscribe.$token.tsx` | KEEP | Just passes token to component |

---

## UnsubscribePage.tsx - Target Code

```tsx
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthPageLayout } from "@/components/auth";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

interface UnsubscribePageProps {
  token: string;
}

export function UnsubscribePage({ token }: UnsubscribePageProps) {
  const [status, setStatus] = useState<"loading" | "success" | "invalid" | "error">("loading");

  const getUserFromToken = useQuery(api.unsubscribe.getUserFromToken, { token });
  const unsubscribe = useMutation(api.unsubscribe.unsubscribe);

  useEffect(() => {
    if (getUserFromToken === undefined) return; // Still loading

    if (getUserFromToken === null) {
      setStatus("invalid");
      return;
    }

    // Token is valid, auto-unsubscribe
    const doUnsubscribe = async () => {
      try {
        await unsubscribe({ token });
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };

    void doUnsubscribe();
  }, [getUserFromToken, token, unsubscribe]);

  const goToHome = () => {
    window.location.href = ROUTES.home.path;
  };

  const goToSignIn = () => {
    window.location.href = ROUTES.signin.path;
  };

  // Loading
  if (status === "loading") {
    return (
      <AuthPageLayout title="Unsubscribing...">
        <Flex justify="center" className="mt-4">
          <LoadingSpinner size="lg" />
        </Flex>
      </AuthPageLayout>
    );
  }

  // Success
  if (status === "success") {
    return (
      <AuthPageLayout title="Unsubscribed" subtitle="You won't receive any more emails.">
        <Flex direction="column" align="center" gap="lg">
          <Icon icon={Check} size="lg" className="text-status-success" />
          <Button variant="secondary" onClick={goToHome} className="w-full">
            Go to Home
          </Button>
        </Flex>
      </AuthPageLayout>
    );
  }

  // Invalid
  if (status === "invalid") {
    return (
      <AuthPageLayout
        title="Link expired"
        subtitle="This unsubscribe link has expired. Sign in to manage your notifications."
      >
        <Button variant="primary" onClick={goToSignIn} className="w-full">
          Sign in
        </Button>
      </AuthPageLayout>
    );
  }

  // Error
  return (
    <AuthPageLayout
      title="Something went wrong"
      subtitle="We couldn't process your request. Please try again later."
    >
      <Button variant="secondary" onClick={goToHome} className="w-full">
        Go to Home
      </Button>
    </AuthPageLayout>
  );
}
```

---

## Removed Elements

| Element | Reason |
|---------|--------|
| Card wrapper (`shadow-lg rounded-lg p-8`) | Use AuthPageLayout |
| `bg-ui-bg-secondary` background | AuthPageLayout uses `bg-ui-bg` |
| Icon circles (48px with bg) | Icons now inline, just color |
| Inline SVGs | Use Icon component |
| Verbose success text (3 paragraphs) | One sentence |
| Error message details box | Generic message sufficient |

---

## Verification Checklist

### Structure
- [ ] Uses AuthPageLayout
- [ ] No card wrapper
- [ ] Background is `bg-ui-bg`
- [ ] Icons use Icon component (not inline SVG)

### Typography
- [ ] Heading is simple ("Unsubscribed", "Link expired", etc.)
- [ ] Subtitle is one sentence
- [ ] No verbose explanatory text

### States
- [ ] Loading: spinner + "Unsubscribing..."
- [ ] Success: checkmark + one sentence + home button
- [ ] Invalid: "Link expired" + sign in button
- [ ] Error: generic message + home button

### Behavior
- [ ] Auto-unsubscribe on valid token (one-click)
- [ ] All states have navigation button
- [ ] No dead ends

### Accessibility
- [ ] Focus on action button after state change
- [ ] Icons have aria-hidden
- [ ] Heading announces state

---

## After Implementation

1. Run `pnpm screenshots` for new captures
2. Test with expired token
3. Test happy path
4. Update DIRECTOR.md status
