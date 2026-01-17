import { createFileRoute } from "@tanstack/react-router";
import { Unauthenticated } from "convex/react";
import { AuthLink, AuthPageLayout, SignUpForm, SmartAuthGuard } from "@/components/auth";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/signup")({
  component: SignUpRoute,
  ssr: false,
});

function SignUpRoute() {
  return (
    <SmartAuthGuard>
      <Unauthenticated>
        <AuthPageLayout title="Create an account" subtitle="Sign up to get started with Nixelo">
          <SignUpForm />
          <div className="text-center text-sm text-ui-text-tertiary mt-4">
            <span>Already have an account? </span>
            <AuthLink to={ROUTES.signin.path}>Sign in</AuthLink>
          </div>
        </AuthPageLayout>
      </Unauthenticated>
    </SmartAuthGuard>
  );
}
