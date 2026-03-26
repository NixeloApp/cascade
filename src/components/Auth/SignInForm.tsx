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
import { useEffect, useRef, useState } from "react";
import { Stack } from "@/components/ui/Stack";
import { ROUTES } from "@/config/routes";
import { usePublicQuery } from "@/hooks/useConvexHelpers";
import { getEmailDomain, isGoogleWorkspaceSsoConnection } from "@/lib/sso-discovery";
import { TEST_IDS } from "@/lib/test-ids";
import { showError } from "@/lib/toast";
import { Input } from "../ui/form/Input";
import { AuthEmailFormSection } from "./AuthEmailFormSection";
import { AuthLinkButton } from "./AuthLink";
import { AuthMethodDivider } from "./AuthMethodDivider";
import { GoogleAuthButton } from "./GoogleAuthButton";

function getSignInButtonText(hasGoogleWorkspaceSso: boolean, emailDomain: string | null): string {
  return hasGoogleWorkspaceSso && emailDomain
    ? `Continue with Google Workspace (${emailDomain})`
    : "Sign in with Google";
}

function getSignInErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes("invalid password")) {
    return "Invalid password. Please try again.";
  }

  if (message.includes("verify your email") || message.includes("email not verified")) {
    return "Verify your email before signing in.";
  }

  if (message.includes("temporarily locked")) {
    return "Too many failed attempts. Try again in a few minutes.";
  }

  if (message.includes("account not found") || message.includes("invalid credentials")) {
    return "We couldn't find an account with that email and password.";
  }

  return "Could not sign in. Please check your credentials and try again.";
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
  const [email, setEmail] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Debounce SSO discovery to avoid querying on every keystroke
  const [debouncedEmail, setDebouncedEmail] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedEmail(email), 300);
    return () => clearTimeout(timer);
  }, [email]);

  const emailDomain = getEmailDomain(debouncedEmail);
  const ssoConnection = usePublicQuery(
    api.sso.getForDomain,
    emailDomain
      ? {
          domain: emailDomain,
        }
      : "skip",
  );
  const hasGoogleWorkspaceSso = isGoogleWorkspaceSsoConnection(ssoConnection);

  useEffect(() => {
    if (!showEmailForm) {
      return;
    }

    emailInputRef.current?.focus();
  }, [showEmailForm]);

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
        <AuthEmailFormSection
          open={showEmailForm}
          submitting={submitting}
          submitLabel="Sign in"
          onRequestOpen={handleShowEmailForm}
          footer={
            <AuthLinkButton onClick={() => navigate({ to: ROUTES.forgotPassword.path })}>
              Forgot password?
            </AuthLinkButton>
          }
        >
          <Stack gap="md">
            <Input
              ref={emailInputRef}
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="transition-default"
              autoComplete="email"
              data-testid={TEST_IDS.AUTH.EMAIL_INPUT}
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              className="transition-default"
              data-testid={TEST_IDS.AUTH.PASSWORD_INPUT}
            />
          </Stack>
        </AuthEmailFormSection>
      </form>
    </div>
  );
}
