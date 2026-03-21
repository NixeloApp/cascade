import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AuthLink,
  AuthPageLayout,
  AuthRedirect,
  ForgotPasswordForm,
  ResetPasswordForm,
} from "@/components/Auth";
import { getOptionalAuthFlowEmail } from "@/components/Auth/authFlowSearch";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

interface ForgotPasswordSearch {
  step?: "reset";
  email?: string;
}

const RESET_EMAIL_STORAGE_KEY = "auth:forgot-password-email";

function getStoredResetEmail() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(RESET_EMAIL_STORAGE_KEY);
  } catch {
    // sessionStorage may throw SecurityError in restricted contexts
    return null;
  }
}

function setStoredResetEmail(email: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(RESET_EMAIL_STORAGE_KEY, email);
  } catch {
    // sessionStorage may throw SecurityError in restricted contexts
  }
}

function clearStoredResetEmail() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(RESET_EMAIL_STORAGE_KEY);
  } catch {
    // sessionStorage may throw SecurityError in restricted contexts
  }
}

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordRoute,
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ForgotPasswordSearch => ({
    step: search.step === "reset" ? "reset" : undefined,
    email: search.step === "reset" ? getOptionalAuthFlowEmail(search.email) : undefined,
  }),
});

/**
 * Public forgot-password route with optional search-driven reset state for screenshot coverage.
 */
export function ForgotPasswordRoute() {
  return (
    <AuthRedirect>
      <ForgotPasswordPage />
    </AuthRedirect>
  );
}

function ForgotPasswordPage() {
  const search = Route.useSearch();
  const [email, setEmail] = useState<string | null>(() => search.email ?? getStoredResetEmail());
  const navigate = Route.useNavigate();

  useEffect(() => {
    if (search.step === "reset") {
      const activeEmail = search.email ?? getStoredResetEmail();
      if (activeEmail !== null) {
        setEmail(activeEmail);
        setStoredResetEmail(activeEmail);
      }
      return;
    }

    clearStoredResetEmail();
    setEmail(null);
  }, [search.email, search.step]);

  if (search.step === "reset" && email) {
    return (
      <AuthPageLayout
        title="Check your email"
        subtitle={
          <>
            We sent a code to{" "}
            <Typography as="strong" variant="strong">
              {email}
            </Typography>
          </>
        }
      >
        <ResetPasswordForm
          email={email}
          onSuccess={() => {
            clearStoredResetEmail();
            navigate({ to: ROUTES.app.path });
          }}
          onRetry={() => {
            clearStoredResetEmail();
            setEmail(null);
            navigate({
              replace: true,
              search: {},
            });
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
          Remember your password? <AuthLink to={ROUTES.signin.path}>Sign in →</AuthLink>
        </>
      }
    >
      <ForgotPasswordForm
        onCodeSent={(requestedEmail) => {
          const normalizedEmail = requestedEmail.trim().toLowerCase();
          setEmail(normalizedEmail);
          setStoredResetEmail(normalizedEmail);
          navigate({
            replace: true,
            search: {
              step: "reset",
            },
          });
        }}
      />
    </AuthPageLayout>
  );
}
