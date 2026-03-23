import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { PageContent, PageError, PageLayout } from "@/components/layout";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useProjectByKey } from "@/hooks/useProjectByKey";

// Lazy load the time tracking page for better performance
const TimeTrackingPage = React.lazy(() =>
  import("@/components/TimeTracking/TimeTrackingPage").then((module) => ({
    default: module.TimeTrackingPage,
  })),
);

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/timesheet")({
  component: TimesheetPage,
});

function TimesheetPage() {
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
    <PageLayout>
      <React.Suspense
        fallback={
          <Flex align="center" justify="center" className="h-full">
            <LoadingSpinner message="Loading timesheet..." />
          </Flex>
        }
      >
        <TimeTrackingPage projectId={project._id} userRole={project.userRole} />
      </React.Suspense>
    </PageLayout>
  );
}
