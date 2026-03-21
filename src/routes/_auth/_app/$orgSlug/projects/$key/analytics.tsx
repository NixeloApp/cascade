import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageContent, PageError } from "@/components/layout";
import { SectionErrorFallback } from "@/components/SectionErrorFallback";
import { useProjectByKey } from "@/hooks/useProjectByKey";

// Lazy load AnalyticsDashboard (heavy charts/recharts dependency)
const AnalyticsDashboard = lazy(() =>
  import("@/components/AnalyticsDashboard").then((m) => ({ default: m.AnalyticsDashboard })),
);

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { key } = Route.useParams();
  const project = useProjectByKey(key);

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
      <Suspense fallback={<PageContent isLoading>{null}</PageContent>}>
        <AnalyticsDashboard
          projectId={project._id}
          projectName={project.name}
          projectKey={project.key}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
