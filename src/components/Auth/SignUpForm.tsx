/**
 * Sign Up Form
 *
 * Registration form with email/password and Google OAuth.
 * Includes password strength indicator and email verification.
 * Validates form inputs before submission.
 */

import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { ROUTES } from "@/config/routes";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/form/Input";
import { Typography } from "../ui/Typography";
import { EmailVerificationForm } from "./EmailVerificationForm";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

function SignUpInitialAction() {
  return (
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
  );
}

function SignUpSubmittingState() {
  return (
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
  );
}

async function submitPasswordSignUp({
  event,
  signIn,
  setEmail,
  setShowVerification,
  setSubmitting,
}: {
  event: React.FormEvent<HTMLFormElement>;
  signIn: ReturnType<typeof useAuthActions>["signIn"];
  setEmail: (value: string) => void;
  setShowVerification: (value: boolean) => void;
  setSubmitting: (value: boolean) => void;
}) {
  setSubmitting(true);

  const formData = new FormData(event.currentTarget);
  const formEmail = formData.get("email") as string;
  formData.set("flow", "signUp");

  try {
    await signIn("password", formData);
    showSuccess("Check your email for a verification code");
    setEmail(formEmail);
    setShowVerification(true);
  } catch (error) {
    showError(error, "Could not create account");
    setSubmitting(false);
  }
}

function AuthStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <Flex justify="center" gap="sm" className="mb-6">
      {[0, 1, 2].map((step) => (
        <Card
          key={step}
          recipe={step <= currentStep ? "authStepIndicatorActive" : "authStepIndicator"}
        />
      ))}
    </Flex>
  );
}

function SignUpVerificationStep({
  email,
  navigate,
}: {
  email: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="w-full">
      <AuthStepIndicator currentStep={2} />
      <div className="animate-fade-in">
        <EmailVerificationForm
          email={email}
          onVerified={() => {
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

function SignUpEmailButton({
  formReady,
  hydrated,
  password,
  showEmailForm,
  submitting,
  setPassword,
  handleShowEmailForm,
}: {
  formReady: boolean;
  hydrated: boolean;
  password: string;
  showEmailForm: boolean;
  submitting: boolean;
  setPassword: (value: string) => void;
  handleShowEmailForm: () => void;
}) {
  return (
    <Flex direction="column">
      <div
        data-testid={showEmailForm ? TEST_IDS.AUTH.EMAIL_FORM : undefined}
        className={cn(
          "overflow-hidden transition-all duration-medium ease-out",
          showEmailForm ? "mb-3 max-h-64 opacity-100" : "max-h-0 opacity-0",
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password ? (
            <PasswordStrengthIndicator password={password} className="-mt-1" />
          ) : (
            <Typography variant="caption" color="tertiary" className="-mt-2">
              Must be at least 8 characters
            </Typography>
          )}
        </Flex>
      </div>
      <Button
        type={showEmailForm ? "submit" : "button"}
        onClick={!showEmailForm ? handleShowEmailForm : undefined}
        variant={showEmailForm ? "primary" : "secondary"}
        size="lg"
        className={cn("w-full transition-all duration-medium", showEmailForm && "shadow-card")}
        disabled={submitting || !hydrated}
        data-testid={TEST_IDS.AUTH.SUBMIT_BUTTON}
      >
        {!showEmailForm ? (
          <SignUpInitialAction />
        ) : submitting ? (
          <SignUpSubmittingState />
        ) : (
          "Create account"
        )}
      </Button>
    </Flex>
  );
}

/**
 * Sign up form with email/password registration and Google OAuth.
 */
export function SignUpForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    void submitPasswordSignUp({
      event: e,
      signIn,
      setEmail,
      setShowVerification,
      setSubmitting,
    });
  };

  // Determine current step for indicator
  const currentStep = showVerification ? 2 : showEmailForm ? 1 : 0;

  if (showVerification) {
    return <SignUpVerificationStep email={email} navigate={navigate} />;
  }

  return (
    <div className="w-full">
      {/* Step indicator - only show when step >= 1 */}
      {currentStep > 0 && <AuthStepIndicator currentStep={currentStep} />}

      <GoogleAuthButton redirectTo={ROUTES.app.path} text="Sign up with Google" />
      <Flex align="center" justify="center" className="my-4">
        <hr className="grow border-ui-border" />
        <Typography variant="small" color="tertiary" as="span" className="mx-4">
          or
        </Typography>
        <hr className="grow border-ui-border" />
      </Flex>
      <form onSubmit={handleSubmit} data-testid={TEST_IDS.AUTH.FORM}>
        {hydrated ? (
          <span data-testid={TEST_IDS.AUTH.FORM_HYDRATED} hidden aria-hidden="true" />
        ) : null}
        {formReady ? (
          <span data-testid={TEST_IDS.AUTH.FORM_READY} hidden aria-hidden="true" />
        ) : null}
        <SignUpEmailButton
          formReady={formReady}
          hydrated={hydrated}
          password={password}
          showEmailForm={showEmailForm}
          submitting={submitting}
          setPassword={setPassword}
          handleShowEmailForm={handleShowEmailForm}
        />
      </form>
    </div>
  );
}
