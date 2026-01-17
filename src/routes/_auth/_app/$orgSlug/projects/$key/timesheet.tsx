import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Lazy load the timesheet component for better performance
const ProjectTimesheet = React.lazy(() => import("@/components/TimeTracking/ProjectTimesheet"));

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/timesheet")({
  component: TimesheetPage,
});

function TimesheetPage() {
  const { key } = Route.useParams();

  return (
    <React.Suspense
      fallback={
        <Flex align="center" justify="center" className="h-full">
          <LoadingSpinner message="Loading timesheet..." />
        </Flex>
      }
    >
      <ProjectTimesheet projectKey={key} />
    </React.Suspense>
  );
}
