/**
 * Email Verification Form
 *
 * OTP code entry for email verification.
 * Sent after registration to verify email address.
 * Supports code resend for expired or lost codes.
 */

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Mail } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/form/Input";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { AuthFlowIntro } from "./AuthFlowIntro";
import { AuthLinkButton } from "./AuthLink";

interface EmailVerificationFormProps {
  email: string;
  onVerified: () => void;
  onResend: () => void;
}

/**
 * Form for entering email verification code sent during registration.
 */
export function EmailVerificationForm({ email, onVerified, onResend }: EmailVerificationFormProps) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("email", email);
    formData.set("flow", "email-verification");

    void signIn("password", formData)
      .then(() => {
        showSuccess("Email verified successfully!");
        onVerified();
      })
      .catch(() => {
        showError("Invalid code. Please try again.");
      })
      .finally(() => setSubmitting(false));
  };

  const handleResend = () => {
    setResending(true);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("flow", "signUp");

    // Trigger resend by attempting signup again - Convex will resend the code
    void signIn("password", formData)
      .catch(() => {
        // Expected to "fail" since user exists, but code will be resent
      })
      .finally(() => {
        setResending(false);
        showSuccess("Verification code resent!");
        onResend();
      });
  };

  return (
    <Stack gap="lg">
      <AuthFlowIntro
        icon={Mail}
        title="Verify your email"
        description={
          <>
            We sent a verification code to{" "}
            <Typography variant="label" as="span">
              {email}
            </Typography>
          </>
        }
      />
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Input
            type="text"
            name="code"
            placeholder="Enter 8-digit code"
            required
            pattern="[0-9]{8}"
            maxLength={8}
            data-testid={TEST_IDS.AUTH.VERIFICATION_CODE_INPUT}
            variant="otpCode"
            autoComplete="one-time-code"
          />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
            isLoading={submitting}
            data-testid={TEST_IDS.AUTH.VERIFICATION_SUBMIT_BUTTON}
          >
            Verify email
          </Button>
          <AuthLinkButton onClick={handleResend} disabled={resending}>
            {resending ? "Sending..." : "Didn't receive a code? Resend"}
          </AuthLinkButton>
        </Stack>
      </form>
    </Stack>
  );
}
