import { createFileRoute } from "@tanstack/react-router";
import { AuthLink, AuthPageLayout, AuthRedirect, SignUpForm } from "@/components/Auth";
import { getOptionalAuthFlowEmail } from "@/components/Auth/authFlowSearch";
import { ROUTES } from "@/config/routes";

interface SignUpSearch {
  step?: "verify";
  email?: string;
}

export const Route = createFileRoute("/signup")({
  component: SignUpRoute,
  ssr: false,
  validateSearch: (search: Record<string, unknown>): SignUpSearch => {
    const step = search.step === "verify" ? "verify" : undefined;
    return {
      step,
      email: step === "verify" ? getOptionalAuthFlowEmail(search.email) : undefined,
    };
  },
});

/**
 * Public signup route with optional search-driven verification state for screenshot coverage.
 */
export function SignUpRoute() {
  const search = Route.useSearch();
  const initialVerificationEmail = search.step === "verify" ? search.email : undefined;

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
        <SignUpForm initialVerificationEmail={initialVerificationEmail} />
      </AuthPageLayout>
    </AuthRedirect>
  );
}
