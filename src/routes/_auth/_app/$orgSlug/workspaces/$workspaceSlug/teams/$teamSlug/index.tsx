import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/",
)({
  component: TeamHome,
});

function TeamHome() {
  const { organizationId, orgSlug } = useOrganization();
  const { workspaceSlug, teamSlug } = Route.useParams();
  const navigate = useNavigate();

  const workspace = useAuthenticatedQuery(api.workspaces.getBySlug, {
    organizationId,
    slug: workspaceSlug,
  });

  const team = useAuthenticatedQuery(
    api.teams.getBySlug,
    workspace?._id
      ? {
          workspaceId: workspace._id,
          slug: teamSlug,
        }
      : "skip",
  );

  // Redirect to team board
  useEffect(() => {
    if (team) {
      navigate({
        to: ROUTES.workspaces.teams.board.path,
        params: { orgSlug, workspaceSlug, teamSlug },
        replace: true,
      });
    }
  }, [team, orgSlug, workspaceSlug, teamSlug, navigate]);

  return null;
}
