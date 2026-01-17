import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/",
)({
  component: ProjectIndexPage,
});

function ProjectIndexPage() {
  const { key, orgSlug, workspaceSlug, teamSlug } = Route.useParams();

  // Redirect to board by default
  return (
    <Navigate
      to={ROUTES.workspaces.teams.projects.board.path}
      params={{ orgSlug, workspaceSlug, teamSlug, key }}
      replace
    />
  );
}
