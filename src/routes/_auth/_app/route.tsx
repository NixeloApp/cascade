import { api } from "@convex/_generated/api";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();

  // Get user's organizations to check if we need initialization
  const userOrganizations = useQuery(
    api.organizations.getUserOrganizations,
    isAuthenticated ? undefined : "skip",
  );

  if (isAuthLoading || userOrganizations === undefined) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  // User has no organizations - initialize default organization
  if (userOrganizations.length === 0) {
    // Check if we already have a default organization being created?
    // The InitializeOrganization component handles concurrent creation via ref.
    return <InitializeOrganization />;
  }

  return <Outlet />;
}

// Component to initialize default organization for users without one
function InitializeOrganization() {
  const navigate = useNavigate();
  const initializeDefaultOrganization = useMutation(
    api.organizations.initializeDefaultOrganization,
  );
  const initRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Use ref to prevent duplicate initialization calls (survives re-renders)
      if (initRef.current) return;
      initRef.current = true;
      try {
        const result = await initializeDefaultOrganization({});
        // Navigate to the new organization's dashboard
        if (result.slug) {
          navigate({
            to: ROUTES.dashboard.path,
            params: { orgSlug: result.slug },
            replace: true,
          });
        } else {
          // Fallback: reload to trigger organization query refresh
          window.location.reload();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create organization");
        initRef.current = false; // Allow retry on error
      }
    };
    init();
  }, [initializeDefaultOrganization, navigate]);

  if (error) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-medium mb-2 text-status-error">
            Error
          </Typography>
          <Typography variant="p" color="secondary">
            {error}
          </Typography>
        </div>
      </Flex>
    );
  }

  return (
    <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <Typography variant="p" color="secondary" className="mt-4">
          Setting up your project...
        </Typography>
      </div>
    </Flex>
  );
}
