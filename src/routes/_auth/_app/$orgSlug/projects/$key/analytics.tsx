import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageContent, PageError } from "@/components/Layout";
import { SectionErrorFallback } from "@/components/SectionErrorFallback";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { key } = Route.useParams();
  const project = useQuery(api.projects.getByKey, { key });

  if (project === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  if (!project) {
    return (
      <PageError
        title="Project Not Found"
        message={`The project "${key}" doesn't exist or you don't have access to it.`}
      />
    );
  }

  return (
    <ErrorBoundary fallback={<SectionErrorFallback title="Analytics Error" />}>
      <AnalyticsDashboard projectId={project._id} />
    </ErrorBoundary>
  );
}
