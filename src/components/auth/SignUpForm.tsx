import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flex } from "@/components/ui/Flex";
import { ROUTES } from "@/config/routes";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Input } from "../ui/form/Input";
import { Typography } from "../ui/Typography";
import { EmailVerificationForm } from "./EmailVerificationForm";
import { GoogleAuthButton } from "./GoogleAuthButton";

export function SignUpForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Set hydrated on mount
  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleShowEmailForm = () => {
    setShowEmailForm(true);
    // Use microtask to ensure fields are rendered
    void Promise.resolve().then(() => setFormReady(true));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!showEmailForm) {
      handleShowEmailForm();
      return;
    }

    if (!formReady) return;
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get("email") as string;
    formData.set("flow", "signUp");

    void signIn("password", formData)
      .then(() => {
        toast.success("Check your email for a verification code");
        setEmail(formEmail);
        setShowVerification(true);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Could not create account";
        toast.error(message);
        setSubmitting(false);
      });
  };

  // Determine current step for indicator
  const currentStep = showVerification ? 2 : showEmailForm ? 1 : 0;

  if (showVerification) {
    return (
      <div className="w-full">
        {/* Step indicator */}
        <Flex justify="center" gap="sm" className="mb-6">
          {[0, 1, 2].map((step) => (
            <div
              key={step}
              className={cn(
                "h-1.5 rounded-pill transition-all duration-300",
                step <= currentStep ? "w-8 bg-brand" : "w-4 bg-ui-border",
              )}
            />
          ))}
        </Flex>
        <div className="animate-fade-in">
          <EmailVerificationForm
            email={email}
            onVerified={() => {
              // Redirect to /app gateway which handles auth routing
              navigate({ to: ROUTES.app.path });
            }}
            onResend={() => {
              // Stay on verification view
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Step indicator */}
      <Flex justify="center" gap="sm" className="mb-6">
        {[0, 1, 2].map((step) => (
          <div
            key={step}
            className={cn(
              "h-1.5 rounded-pill transition-all duration-300",
              step <= currentStep ? "w-8 bg-brand" : "w-4 bg-ui-border",
            )}
          />
        ))}
      </Flex>

      <GoogleAuthButton redirectTo={ROUTES.app.path} text="Sign up with Google" />
      <Flex align="center" justify="center" className="my-4">
        <hr className="grow border-ui-border" />
        <Typography variant="small" color="tertiary" as="span" className="mx-4">
          or
        </Typography>
        <hr className="grow border-ui-border" />
      </Flex>
      <form
        className="flex flex-col"
        onSubmit={handleSubmit}
        data-form-ready={formReady}
        data-hydrated={hydrated}
      >
        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            showEmailForm ? "grid-rows-[1fr] opacity-100 mb-3" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <Flex direction="column" className="overflow-hidden gap-form-field">
            <Input
              type="email"
              name="email"
              placeholder="Email"
              required={formReady}
              className="transition-default"
              data-testid={TEST_IDS.AUTH.EMAIL_INPUT}
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              minLength={8}
              required={formReady}
              className="transition-default"
              data-testid={TEST_IDS.AUTH.PASSWORD_INPUT}
            />
            {/* Password hint */}
            <Typography variant="caption" color="tertiary" className="-mt-2">
              Must be at least 8 characters
            </Typography>
          </Flex>
        </div>
        <Button
          type="submit"
          variant={showEmailForm ? "primary" : "secondary"}
          size="lg"
          className={cn("w-full transition-all duration-300", showEmailForm && "shadow-card")}
          disabled={submitting || !hydrated}
          data-testid={TEST_IDS.AUTH.SUBMIT_BUTTON}
        >
          {!showEmailForm ? (
            <Flex align="center" gap="md">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span>Continue with email</span>
            </Flex>
          ) : submitting ? (
            <Flex align="center" gap="sm">
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
              <span>Creating account...</span>
            </Flex>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </div>
  );
}
