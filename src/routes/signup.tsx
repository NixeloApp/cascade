import { createFileRoute } from "@tanstack/react-router";
import { AuthLink, AuthPageLayout, AuthRedirect, SignUpForm } from "@/components/auth";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/signup")({
  component: SignUpRoute,
  ssr: false,
});

function SignUpRoute() {
  return (
    <AuthRedirect>
      <AuthPageLayout
        title="Create your account"
        subtitle={
          <>
            Already have an account? <AuthLink to={ROUTES.signin.path}>Sign in →</AuthLink>
          </>
        }
      >
        <SignUpForm />
      </AuthPageLayout>
    </AuthRedirect>
  );
}
