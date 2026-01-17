import { createFileRoute } from "@tanstack/react-router";
import { ProjectsList } from "@/components/ProjectsList";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/",
)({
  component: ProjectsList,
});
