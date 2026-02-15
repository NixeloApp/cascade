import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PageContent, PageError } from "@/components/Layout";
import { RoadmapView } from "@/components/RoadmapView";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/roadmap")({
  component: RoadmapPage,
});

function RoadmapPage() {
  const { key } = Route.useParams();
  const project = useQuery(api.projects.getByKey, { key });
  const sprints = useQuery(
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
    <RoadmapView
      projectId={project._id}
      sprintId={activeSprint?._id as Id<"sprints"> | undefined}
      canEdit={canEdit}
    />
  );
}
