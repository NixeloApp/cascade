import { createFileRoute } from "@tanstack/react-router";
import { Unauthenticated } from "convex/react";
import { AuthLink, AuthPageLayout, SignInForm, SmartAuthGuard } from "@/components/auth";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/signin")({
  component: SignInRoute,
  ssr: false,
});

function SignInRoute() {
  return (
    <SmartAuthGuard>
      <Unauthenticated>
        <AuthPageLayout title="Welcome back" subtitle="Sign in to your account to continue">
          <SignInForm />
          <div className="text-center text-sm text-ui-text-tertiary mt-4">
            <span>Don't have an account? </span>
            <AuthLink to={ROUTES.signup.path}>Sign up</AuthLink>
          </div>
        </AuthPageLayout>
      </Unauthenticated>
    </SmartAuthGuard>
  );
}
