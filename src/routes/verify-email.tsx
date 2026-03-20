import { createFileRoute } from "@tanstack/react-router";
import { AuthLink, AuthPageLayout, AuthRedirect, EmailVerificationForm } from "@/components/Auth";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

interface VerifyEmailSearch {
  email?: string;
}

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailRoute,
  ssr: false,
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
});

function VerifyEmailRoute() {
  return (
    <AuthRedirect>
      <VerifyEmailPage />
    </AuthRedirect>
  );
}

function VerifyEmailPage() {
  const { email } = Route.useSearch();
  const navigate = Route.useNavigate();

  if (!email) {
    return (
      <AuthPageLayout
        title="Check your email"
        subtitle={
          <>
            Need a new code? <AuthLink to={ROUTES.signup.path}>Create an account</AuthLink>
          </>
        }
      >
        <Typography color="secondary" className="text-center">
          We need your email address to verify your account.
        </Typography>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title="Check your email"
      subtitle={
        <>
          We sent a verification code to{" "}
          <Typography as="strong" variant="strong">
            {email}
          </Typography>
        </>
      }
    >
      <EmailVerificationForm
        email={email}
        onVerified={() => {
          navigate({ to: ROUTES.app.path });
        }}
        onResend={() => {}}
      />
    </AuthPageLayout>
  );
}
