import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { lazy, Suspense, useEffect } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { ROUTES } from "@/config/routes";

// Lazy load TimeTrackingPage (admin-only, heavy component)
const TimeTrackingPage = lazy(() =>
  import("@/components/TimeTracking/TimeTrackingPage").then((m) => ({
    default: m.TimeTrackingPage,
  })),
);

export const Route = createFileRoute("/_auth/_app/$orgSlug/time-tracking")({
  component: TimeTrackingPageRoute,
});

function TimeTrackingPageRoute() {
  const { orgSlug } = Route.useParams();
  const navigate = useNavigate();
  const isAdmin = useQuery(api.users.isOrganizationAdmin);

  // Redirect non-admins to dashboard
  useEffect(() => {
    if (isAdmin === false) {
      navigate({
        to: ROUTES.dashboard.path,
        params: { orgSlug },
      });
    }
  }, [isAdmin, orgSlug, navigate]);

  // Loading state
  if (isAdmin === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  // Not admin - will redirect
  if (!isAdmin) {
    return null;
  }

  // Platform admin - show all tabs
  return (
    <PageLayout>
      <PageHeader
        title="Time Tracking"
        description="Track time, analyze costs, and monitor burn rate"
      />
      <Suspense fallback={<PageContent isLoading>{null}</PageContent>}>
        <TimeTrackingPage isGlobalAdmin />
      </Suspense>
    </PageLayout>
  );
}
