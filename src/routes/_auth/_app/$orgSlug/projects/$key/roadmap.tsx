import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { PageContent, PageError } from "@/components/layout";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useProjectByKey } from "@/hooks/useProjectByKey";

const RoadmapView = lazy(() =>
  import("@/components/RoadmapView").then((m) => ({ default: m.RoadmapView })),
);

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/roadmap")({
  component: RoadmapPage,
});

function RoadmapPage() {
  const { key } = Route.useParams();
  const project = useProjectByKey(key);
  const sprints = useAuthenticatedQuery(
    api.sprints.listByProject,
    project ? { projectId: project._id } : "skip",
  );

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

  const canEdit = project.userRole !== "viewer";
  const activeSprint = sprints?.find((s: Doc<"sprints">) => s.status === "active");

  return (
    <Suspense fallback={<PageContent isLoading>{null}</PageContent>}>
      <RoadmapView
        projectId={project._id}
        sprintId={activeSprint?._id as Id<"sprints"> | undefined}
        canEdit={canEdit}
      />
    </Suspense>
  );
}
