import { createFileRoute } from "@tanstack/react-router";
import { AuthLink, AuthPageLayout, AuthRedirect, SignInForm } from "@/components/Auth";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/signin")({
  component: SignInRoute,
  ssr: false,
});

function SignInRoute() {
  return (
    <AuthRedirect>
      <AuthPageLayout
        title="Sign in to Nixelo"
        subtitle={
          <>
            Don't have an account? <AuthLink to={ROUTES.signup.path}>Sign up →</AuthLink>
          </>
        }
      >
        <SignInForm />
      </AuthPageLayout>
    </AuthRedirect>
  );
}
