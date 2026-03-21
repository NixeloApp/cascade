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
import { Icon } from "@/components/ui/Icon";
import { ROUTES } from "@/config/routes";
import { usePublicQuery } from "@/hooks/useConvexHelpers";
import { Mail } from "@/lib/icons";
import { getEmailDomain, isGoogleWorkspaceSsoConnection } from "@/lib/sso-discovery";
import { TEST_IDS } from "@/lib/test-ids";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Input } from "../ui/form/Input";
import { AuthLinkButton } from "./AuthLink";
import { AuthMethodDivider } from "./AuthMethodDivider";
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
      <AuthMethodDivider />
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
            disabled={!hydrated}
            isLoading={showEmailForm && submitting}
            leftIcon={!showEmailForm ? <Icon icon={Mail} size="md" /> : undefined}
            data-testid={TEST_IDS.AUTH.SUBMIT_BUTTON}
          >
            {showEmailForm ? "Sign in" : "Continue with email"}
          </Button>
        </Flex>
      </form>
    </div>
  );
}
