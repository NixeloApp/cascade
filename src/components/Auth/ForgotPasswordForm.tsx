/**
 * Forgot Password Form
 *
 * Email entry form for initiating password reset.
 * Sends verification code to user's email address.
 * Provides navigation back to sign in form.
 */

import { useAuthActions } from "@convex-dev/auth/react";
import { useRef, useState } from "react";
import { TEST_IDS } from "@/lib/test-ids";
import { showError } from "@/lib/toast";
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
  const formRef = useRef<HTMLFormElement>(null);

  const submitResetRequest = () => {
    const form = formRef.current;
    if (!form || submitting) {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const emailValue = formData.get("email");
    if (typeof emailValue !== "string" || !emailValue.trim()) {
      return;
    }

    setSubmitting(true);

    formData.set("flow", "reset");

    void signIn("password", formData)
      .then(() => {
        onCodeSent(emailValue);
      })
      .catch((error) => {
        showError(error, "Password reset request");
      })
      .finally(() => setSubmitting(false));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitResetRequest();
  };

  return (
    <div className="w-full">
      <Typography variant="h2" className="text-xl font-semibold mb-4">
        Reset your password
      </Typography>
      <Typography variant="p" color="secondary" className="mb-4 text-sm">
        Enter your email and we'll send you a code to reset your password.
      </Typography>
      <form ref={formRef} className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
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
