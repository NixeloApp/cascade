import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ProjectBoard } from "@/components/ProjectBoard";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/board",
)({
  component: BoardPage,
});

function BoardPage() {
  const { key } = Route.useParams();
  const project = useQuery(api.projects.getByKey, { key });

  if (project === undefined) return null;
  if (!project) return <div>Project not found</div>;

  return <ProjectBoard projectId={project._id} />;
}
