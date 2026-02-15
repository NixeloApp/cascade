import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import React from "react";
import { PageContent, PageError, PageLayout } from "@/components/layout";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Lazy load the timesheet component for better performance
const ProjectTimesheet = React.lazy(() => import("@/components/TimeTracking/ProjectTimesheet"));

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/timesheet")({
  component: TimesheetPage,
});

function TimesheetPage() {
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
    <PageLayout>
      <React.Suspense
        fallback={
          <Flex align="center" justify="center" className="h-full">
            <LoadingSpinner message="Loading timesheet..." />
          </Flex>
        }
      >
        <ProjectTimesheet projectId={project._id} userRole={project.userRole} />
      </React.Suspense>
    </PageLayout>
  );
}
