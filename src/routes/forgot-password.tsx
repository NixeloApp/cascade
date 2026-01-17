import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLink, AuthPageLayout, ResetPasswordForm, SmartAuthGuard } from "@/components/auth";
import { ROUTES } from "@/config/routes";
import { getConvexSiteUrl } from "@/lib/convex";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordRoute,
  ssr: false,
});

function ForgotPasswordRoute() {
  return (
    <>
      <Authenticated>
        <SmartAuthGuard />
      </Authenticated>
      <Unauthenticated>
        <ForgotPasswordPage />
      </Unauthenticated>
    </>
  );
}

function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get("email") as string;

    try {
      // Call our secure wrapper - always returns success
      await fetch(`${getConvexSiteUrl()}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formEmail }),
      });
    } catch {
      // Ignore network errors
    }

    // Always show success and proceed to reset form
    setEmail(formEmail);
    setShowReset(true);
    toast.success("If an account exists, you'll receive a reset code");
    setSubmitting(false);
  };

  const navigate = useNavigate();

  if (showReset) {
    return (
      <AuthPageLayout title="Reset password" subtitle="Enter the code from your email">
        <ResetPasswordForm
          email={email}
          onSuccess={() => {
            // Redirect to /app gateway to trigger SmartAuthGuard logic
            navigate({ to: ROUTES.app.path });
          }}
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
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset code"
    >
      <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send reset code"}
        </button>
      </form>
      <div className="text-center text-sm text-ui-text-tertiary mt-4">
        <AuthLink to={ROUTES.signin.path}>Back to sign in</AuthLink>
      </div>
    </AuthPageLayout>
  );
}
