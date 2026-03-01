/**
 * Forgot Password Form
 *
 * Email entry form for initiating password reset.
 * Sends verification code to user's email address.
 * Provides navigation back to sign in form.
 */

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/form/Input";
import { Typography } from "../ui/Typography";
import { AuthLinkButton } from "./AuthLink";

interface ForgotPasswordFormProps {
  onCodeSent: (email: string) => void;
  onBack: () => void;
}

/**
 * Form for initiating password reset by entering email address.
 */
export function ForgotPasswordForm({ onCodeSent, onBack }: ForgotPasswordFormProps) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    formData.set("flow", "reset");

    void signIn("password", formData)
      .then(() => {
        onCodeSent(email);
        showSuccess("Check your email for the reset code");
      })
      .catch((_error) => {
        showError("Could not send reset code. Please check your email.");
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="w-full">
      <Typography variant="h2" className="text-xl font-semibold mb-4">
        Reset your password
      </Typography>
      <Typography variant="p" color="secondary" className="mb-4 text-sm">
        Enter your email and we'll send you a code to reset your password.
      </Typography>
      <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
        <Input
          type="email"
          name="email"
          placeholder="Email"
          required
          data-testid={TEST_IDS.AUTH.EMAIL_INPUT}
        />
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Sending..." : "Send reset code"}
        </Button>
        <AuthLinkButton onClick={onBack}>Back to sign in</AuthLinkButton>
      </form>
    </div>
  );
}
