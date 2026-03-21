import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AuthLink,
  AuthPageLayout,
  AuthRedirect,
  ForgotPasswordForm,
  ResetPasswordForm,
} from "@/components/Auth";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

interface ForgotPasswordSearch {
  step?: "reset";
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
  }),
});

function ForgotPasswordRoute() {
  return (
    <AuthRedirect>
      <ForgotPasswordPage />
    </AuthRedirect>
  );
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState<string | null>(() => getStoredResetEmail());
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  useEffect(() => {
    if (search.step === "reset") {
      // Only update from storage if we get a value - preserve in-memory email
      // when sessionStorage is unavailable (returns null)
      const storedEmail = getStoredResetEmail();
      if (storedEmail !== null) {
        setEmail(storedEmail);
      }
      return;
    }

    clearStoredResetEmail();
    setEmail(null);
  }, [search.step]);

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
