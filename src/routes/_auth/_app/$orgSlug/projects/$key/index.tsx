import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/")({
  component: ProjectIndexPage,
});

function ProjectIndexPage() {
  const { key, orgSlug } = Route.useParams();

  // Redirect to board by default
  return <Navigate to={ROUTES.projects.board.path} params={{ orgSlug, key }} replace />;
}
