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
import { AuthLinkButton } from "./AuthLink";
import { GoogleAuthButton } from "./GoogleAuthButton";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
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
    formData.set("flow", "signIn");

    void signIn("password", formData)
      .then(() => {
        // Redirect to /app gateway which handles auth routing
        navigate({ to: ROUTES.app.path });
      })
      .catch((error) => {
        const message = error.message.includes("Invalid password")
          ? "Invalid password. Please try again."
          : "Could not sign in. Please check your credentials.";
        toast.error(message);
        setSubmitting(false);
      });
  };

  return (
    <div className="w-full">
      <GoogleAuthButton redirectTo={ROUTES.app.path} text="Sign in with Google" />
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
        data-expanded={showEmailForm}
        data-testid={TEST_IDS.AUTH.FORM}
      >
        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            showEmailForm ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
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
              <span>Signing in...</span>
            </Flex>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </div>
  );
}
