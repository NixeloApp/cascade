import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLink, AuthPageLayout, AuthRedirect, ResetPasswordForm } from "@/components/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form/Input";
import { ROUTES } from "@/config/routes";
import { getConvexSiteUrl } from "@/lib/convex";
import { TEST_IDS } from "@/lib/test-ids";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordRoute,
  ssr: false,
});

function ForgotPasswordRoute() {
  return (
    <AuthRedirect>
      <ForgotPasswordPage />
    </AuthRedirect>
  );
}

function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get("email") as string;

    try {
      await fetch(`${getConvexSiteUrl()}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formEmail }),
      });
    } catch {
      // Ignore network errors
    }

    setEmail(formEmail);
    setShowReset(true);
    toast.success("If an account exists, you'll receive a reset code");
    setSubmitting(false);
  };

  if (showReset) {
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
            setShowReset(false);
            setEmail("");
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
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
