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
  email?: string;
  step?: "reset";
}

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordRoute,
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ForgotPasswordSearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
    step: search.step === "reset" ? "reset" : undefined,
  }),
});

function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}

function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const formRef = useRef<HTMLFormElement>(null);

  const submitResetRequest = async () => {
    const form = formRef.current;
    if (!form || submitting) {
      return;
    }

    setSubmitting(true);

    const formData = new FormData(form);
    const formEmail = formData.get("email") as string;

    try {
      const response = await fetch(`${getConvexSiteUrl()}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formEmail }),
      });

      if (!response.ok) {
        throw new Error(`Password reset request failed with status ${response.status}`);
      }

      navigate({
        replace: true,
        search: {
          email: formEmail,
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
    void submitResetRequest();
  };

  if (search.step === "reset" && search.email) {
    return (
      <AuthPageLayout
        title="Check your email"
        subtitle={
          <>
            We sent a code to <strong>{search.email}</strong>
          </>
        }
      >
        <ResetPasswordForm
          email={search.email}
          onSuccess={() => navigate({ to: ROUTES.app.path })}
          onRetry={() => {
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
        <Button className="w-full" type="button" disabled={submitting} onClick={submitResetRequest}>
          {submitting ? "Sending..." : "Send reset code"}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
