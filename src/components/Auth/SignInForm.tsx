/**
 * Sign In Form
 *
 * Login form with email/password and Google OAuth.
 * Handles authentication state and navigation.
 * Provides forgot password and sign up links.
 */

import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { ROUTES } from "@/config/routes";
import { usePublicQuery } from "@/hooks/useConvexHelpers";
import { getEmailDomain, isGoogleWorkspaceSsoConnection } from "@/lib/sso-discovery";
import { TEST_IDS } from "@/lib/test-ids";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Input } from "../ui/form/Input";
import { Typography } from "../ui/Typography";
import { AuthLinkButton } from "./AuthLink";
import { GoogleAuthButton } from "./GoogleAuthButton";

function getSignInButtonText(hasGoogleWorkspaceSso: boolean, emailDomain: string | null): string {
  return hasGoogleWorkspaceSso && emailDomain
    ? `Continue with Google Workspace (${emailDomain})`
    : "Sign in with Google";
}

function getSignInErrorMessage(error: Error): string {
  return error.message.includes("Invalid password")
    ? "Invalid password. Please try again."
    : "Could not sign in. Please check your credentials.";
}

function SignInInitialAction() {
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

function SignInSubmittingState() {
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
      <span>Signing in...</span>
    </Flex>
  );
}

async function submitPasswordSignIn({
  event,
  signIn,
  navigate,
  hasGoogleWorkspaceSso,
  setSubmitting,
}: {
  event: React.FormEvent<HTMLFormElement>;
  signIn: ReturnType<typeof useAuthActions>["signIn"];
  navigate: ReturnType<typeof useNavigate>;
  hasGoogleWorkspaceSso: boolean;
  setSubmitting: (value: boolean) => void;
}) {
  if (hasGoogleWorkspaceSso) {
    showError("Your organization uses Google Workspace SSO. Use Google sign-in to continue.");
    return;
  }

  setSubmitting(true);

  const formData = new FormData(event.currentTarget);
  formData.set("flow", "signIn");

  try {
    await signIn("password", formData);
    navigate({ to: ROUTES.app.path });
  } catch (error) {
    showError(getSignInErrorMessage(error as Error));
    setSubmitting(false);
  }
}
/**
 * Sign in form with email/password and Google OAuth options.
 */
export function SignInForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [email, setEmail] = useState("");

  // Public query - SSO discovery must work on sign-in page before auth
  const emailDomain = getEmailDomain(email);
  const ssoConnection = usePublicQuery(
    api.sso.getForDomain,
    emailDomain
      ? {
          domain: emailDomain,
        }
      : "skip",
  );
  const hasGoogleWorkspaceSso = isGoogleWorkspaceSsoConnection(ssoConnection);

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

    void submitPasswordSignIn({
      event: e,
      signIn,
      navigate,
      hasGoogleWorkspaceSso,
      setSubmitting,
    });
  };

  return (
    <div className="w-full">
      <GoogleAuthButton
        redirectTo={ROUTES.app.path}
        text={getSignInButtonText(hasGoogleWorkspaceSso, emailDomain)}
      />
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
        <Flex direction="column">
          <div
            data-testid={showEmailForm ? TEST_IDS.AUTH.EMAIL_FORM : undefined}
            className={cn(
              "overflow-hidden transition-all duration-medium ease-out",
              showEmailForm ? "max-h-48 opacity-100" : "max-h-0 opacity-0",
            )}
          >
            <Flex direction="column" className="overflow-hidden gap-form-field">
              <Input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required={formReady}
                className="transition-default"
                data-testid={TEST_IDS.AUTH.EMAIL_INPUT}
              />
              <Input
                type="password"
                name="password"
                placeholder="Password"
                required={formReady}
                className="transition-default"
                data-testid={TEST_IDS.AUTH.PASSWORD_INPUT}
              />
            </Flex>
          </div>
          {showEmailForm && (
            <div className="text-right mb-3">
              <AuthLinkButton onClick={() => navigate({ to: ROUTES.forgotPassword.path })}>
                Forgot password?
              </AuthLinkButton>
            </div>
          )}
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
              <SignInInitialAction />
            ) : submitting ? (
              <SignInSubmittingState />
            ) : (
              "Sign in"
            )}
          </Button>
        </Flex>
      </form>
    </div>
  );
}
