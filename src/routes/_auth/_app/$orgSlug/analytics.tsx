import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { OrganizationAnalyticsDashboard } from "@/components/Analytics/OrganizationAnalyticsDashboard";
import { PageContent } from "@/components/layout";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute("/_auth/_app/$orgSlug/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { organizationId } = useOrganization();
  const analytics = useAuthenticatedQuery(api.analytics.getOrgAnalytics, { organizationId });

  if (analytics === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  return <OrganizationAnalyticsDashboard analytics={analytics} />;
}
