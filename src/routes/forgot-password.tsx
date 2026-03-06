import { useAuthActions } from "@convex-dev/auth/react";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AuthLink, AuthPageLayout, AuthRedirect, ResetPasswordForm } from "@/components/Auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form/Input";
import { ROUTES } from "@/config/routes";
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
  return (
    <AuthRedirect>
      <ForgotPasswordPage />
    </AuthRedirect>
  );
}

function ForgotPasswordPage() {
  const { signIn } = useAuthActions();
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

    const normalizedEmail = formEmail.trim().toLowerCase();

    try {
      const formData = new FormData();
      formData.set("email", normalizedEmail);
      formData.set("flow", "reset");

      await signIn("password", formData);

      setEmail(normalizedEmail);
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
