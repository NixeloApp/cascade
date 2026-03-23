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
import { Icon } from "@/components/ui/Icon";
import { ROUTES } from "@/config/routes";
import { Mail } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Input } from "../ui/form/Input";
import { Typography } from "../ui/Typography";
import { AuthMethodDivider } from "./AuthMethodDivider";
import { AuthStepIndicator } from "./AuthStepIndicator";
import { EmailVerificationForm } from "./EmailVerificationForm";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

interface SignUpFormProps {
  initialVerificationEmail?: string;
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

function SignUpVerificationStep({
  email,
  navigate,
}: {
  email: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="w-full">
      <Flex direction="column" gap="lg">
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
      </Flex>
    </div>
  );
}

function SignUpEmailButton({
  password,
  showEmailForm,
  submitting,
  setPassword,
  handleShowEmailForm,
}: {
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
          showEmailForm ? "mb-4 max-h-64 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <Flex direction="column" className="overflow-hidden gap-form-field">
          <Input
            type="email"
            name="email"
            placeholder="Email"
            className="transition-default"
            data-testid={TEST_IDS.AUTH.EMAIL_INPUT}
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            minLength={8}
            className="transition-default"
            data-testid={TEST_IDS.AUTH.PASSWORD_INPUT}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password ? (
            <PasswordStrengthIndicator password={password} />
          ) : (
            <Typography variant="caption" color="tertiary">
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
        isLoading={showEmailForm && submitting}
        leftIcon={!showEmailForm ? <Icon icon={Mail} size="md" /> : undefined}
        data-testid={TEST_IDS.AUTH.SUBMIT_BUTTON}
      >
        {showEmailForm ? "Create account" : "Continue with email"}
      </Button>
    </Flex>
  );
}

/**
 * Sign up form with email/password registration and Google OAuth.
 */
export function SignUpForm({ initialVerificationEmail }: SignUpFormProps) {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState(initialVerificationEmail ?? "");
  const [password, setPassword] = useState("");
  const [showVerification, setShowVerification] = useState(Boolean(initialVerificationEmail));
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (!initialVerificationEmail) {
      return;
    }

    setEmail(initialVerificationEmail);
    setShowVerification(true);
  }, [initialVerificationEmail]);

  const handleShowEmailForm = () => {
    setShowEmailForm(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!showEmailForm) {
      handleShowEmailForm();
      return;
    }

    // Validate inputs (replaces browser-native required attribute)
    const formData = new FormData(e.currentTarget);
    const formEmail = (formData.get("email") as string)?.trim();
    const formPassword = formData.get("password") as string;
    if (!formEmail || !formPassword) {
      showError("Please enter both email and password.");
      return;
    }
    if (formPassword.length < 8) {
      showError("Password must be at least 8 characters.");
      return;
    }

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
      <AuthMethodDivider />
      <form onSubmit={handleSubmit} data-testid={TEST_IDS.AUTH.FORM}>
        {/* E2E readiness markers — always present in SPA (no SSR hydration delay) */}
        <span data-testid={TEST_IDS.AUTH.FORM_HYDRATED} hidden aria-hidden="true" />
        {showEmailForm ? (
          <span data-testid={TEST_IDS.AUTH.FORM_READY} hidden aria-hidden="true" />
        ) : null}
        <SignUpEmailButton
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
