import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form/Input";
import { Typography } from "../ui/Typography";
import { AuthLinkButton } from "./AuthLink";

interface EmailVerificationFormProps {
  email: string;
  onVerified: () => void;
  onResend: () => void;
}

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
        toast.success("Email verified successfully!");
        onVerified();
      })
      .catch((_error) => {
        toast.error("Invalid code. Please try again.");
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
        toast.success("Verification code resent!");
        onResend();
      });
  };

  return (
    <div className="w-full text-center">
      {/* Email icon */}
      <Flex justify="center" className="mb-4">
        <Flex align="center" justify="center" className="w-16 h-16 rounded-2xl bg-brand-subtle">
          <svg
            className="w-8 h-8 text-brand"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </Flex>
      </Flex>
      <Typography variant="h2" className="text-xl font-semibold mb-2 tracking-tight">
        Verify your email
      </Typography>
      <Typography variant="p" color="secondary" className="mb-6 text-sm">
        We sent a verification code to{" "}
        <Typography variant="label" as="span" className="text-ui-text">
          {email}
        </Typography>
      </Typography>
      <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
        <Input
          type="text"
          name="code"
          placeholder="Enter 8-digit code"
          required
          pattern="[0-9]{8}"
          maxLength={8}
          className="text-center tracking-widest text-lg transition-default"
          autoComplete="one-time-code"
        />
        <Button
          type="submit"
          size="lg"
          className="w-full shadow-card transition-all duration-300"
          disabled={submitting}
        >
          {submitting ? (
            <Flex align="center" justify="center" gap="sm">
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
              <span>Verifying...</span>
            </Flex>
          ) : (
            "Verify email"
          )}
        </Button>
        <div className="text-center mt-2">
          <AuthLinkButton onClick={handleResend} disabled={resending}>
            {resending ? "Sending..." : "Didn't receive a code? Resend"}
          </AuthLinkButton>
        </div>
      </form>
    </div>
  );
}
