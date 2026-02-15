import { api } from "@convex/_generated/api";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";

/**
 * AuthRedirect - Redirects authenticated users to their correct destination.
 *
 * Used ONLY on public routes (signin, signup) to bounce authenticated users
 * away to their dashboard or onboarding.
 *
 * This is a single-purpose component that follows the 10x engineer principle:
 * do one thing, do it well.
 */
export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useQuery(api.auth.getRedirectDestination);

  useEffect(() => {
    // If we have a redirect destination and it's not the current path, navigate
    if (redirectPath && redirectPath !== location.pathname) {
      navigate({ to: redirectPath, replace: true });
    }
  }, [redirectPath, navigate, location.pathname]);

  // We always render children to avoid unmounting forms during auth transitions.
  // The useEffect handles redirecting away when authentication is fully resolved.
  return <>{children}</>;
}
