import { useAuthActions } from "@convex-dev/auth/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AuthLink, AuthPageLayout, AuthRedirect, ResetPasswordForm } from "@/components/Auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form/Input";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { TEST_IDS } from "@/lib/test-ids";
import { showError } from "@/lib/toast";

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
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState<string | null>(() => getStoredResetEmail());
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const formRef = useRef<HTMLFormElement>(null);

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

  const submitResetRequest = async () => {
    const form = formRef.current;
    if (!form || submitting) {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setSubmitting(true);

    const formData = new FormData(form);
    const formEmail = formData.get("email");
    if (typeof formEmail !== "string" || !formEmail) {
      setSubmitting(false);
      return;
    }

    const normalizedEmail = formEmail.trim().toLowerCase();

    try {
      const formData = new FormData();
      formData.set("email", normalizedEmail);
      formData.set("flow", "reset");

      await signIn("password", formData);

      setEmail(normalizedEmail);
      setStoredResetEmail(normalizedEmail);
      navigate({
        replace: true,
        search: {
          step: "reset",
        },
      });
    } catch (error) {
      showError(error, "Password reset request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submitResetRequest();
  };

  if (search.step === "reset" && email) {
    return (
      <AuthPageLayout
        title="Check your email"
        subtitle={
          <>
            We sent a code to{" "}
            <Typography as="strong" variant="label">
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
      <form ref={formRef} className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
