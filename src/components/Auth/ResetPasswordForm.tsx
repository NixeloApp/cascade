/**
 * Reset Password Form
 *
 * New password entry with verification code.
 * Validates password strength using zxcvbn.
 * Completes the password reset flow.
 */

import { useAuthActions } from "@convex-dev/auth/react";
import { useRef, useState } from "react";
import { Lock } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form/Input";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { AuthFlowIntro } from "./AuthFlowIntro";
import { AuthLinkButton } from "./AuthLink";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

interface ResetPasswordFormProps {
  email: string;
  onSuccess: () => void;
  onRetry: () => void;
}

/**
 * Form for entering new password and verification code during password reset.
 */
export function ResetPasswordForm({ email, onSuccess, onRetry }: ResetPasswordFormProps) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const submitReset = () => {
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
    formData.set("email", email);
    formData.set("flow", "reset-verification");

    void signIn("password", formData)
      .then(() => {
        showSuccess("Password reset successfully!");
        onSuccess();
      })
      .catch((error) => {
        showError(error, "Password reset");
      })
      .finally(() => setSubmitting(false));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitReset();
  };

  return (
    <Stack gap="lg">
      <AuthFlowIntro
        icon={Lock}
        title="Enter reset code"
        description={
          <>
            We sent a code to{" "}
            <Typography as="strong" variant="strong">
              {email}
            </Typography>
            . Enter it below with your new password.
          </>
        }
      />
      <form ref={formRef} onSubmit={handleSubmit}>
        <Flex direction="column" gap="md">
          <Input
            type="text"
            name="code"
            placeholder="8-digit code"
            required
            pattern="[0-9]{8}"
            maxLength={8}
            data-testid={TEST_IDS.AUTH.RESET_CODE_INPUT}
            variant="otpCode"
          />
          <Input
            type="password"
            name="newPassword"
            placeholder="New password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            data-testid={TEST_IDS.AUTH.RESET_PASSWORD_INPUT}
          />
          <PasswordStrengthIndicator password={newPassword} />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
            isLoading={submitting}
            data-testid={TEST_IDS.AUTH.RESET_SUBMIT_BUTTON}
          >
            Reset password
          </Button>
          <AuthLinkButton onClick={onRetry}>Didn't receive a code? Try again</AuthLinkButton>
        </Flex>
      </form>
    </Stack>
  );
}
