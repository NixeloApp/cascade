import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AuthLink, AuthPageLayout, ResetPasswordForm } from "@/components/Auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form/Input";
import { ROUTES } from "@/config/routes";
import { getConvexSiteUrl } from "@/lib/convex";
import { TEST_IDS } from "@/lib/test-ids";
import { showError } from "@/lib/toast";

interface ForgotPasswordSearch {
  step?: "reset";
}

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordRoute,
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ForgotPasswordSearch => ({
    step: search.step === "reset" ? "reset" : undefined,
  }),
});

function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}

function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const formRef = useRef<HTMLFormElement>(null);

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

    try {
      const response = await fetch(`${getConvexSiteUrl()}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formEmail }),
      });

      if (!response.ok) {
        throw new Error(`Password reset request failed with status ${response.status}`);
      }

      setEmail(formEmail);
      navigate({
        replace: true,
        search: {
          step: "reset",
        },
      });
    } catch {
      showError("Could not send reset code. Please check your email.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submitResetRequest();
  };

  const handleKeyDownCapture = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();
    formRef.current?.requestSubmit();
  };

  if (search.step === "reset" && email) {
    return (
      <AuthPageLayout
        title="Check your email"
        subtitle={
          <>
            We sent a code to <strong>{email}</strong>
          </>
        }
      >
        <ResetPasswordForm
          email={email}
          onSuccess={() => navigate({ to: ROUTES.app.path })}
          onRetry={() => {
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
      <form
        ref={formRef}
        className="flex flex-col gap-4"
        onSubmit={handleSubmit}
        onKeyDownCapture={handleKeyDownCapture}
      >
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
