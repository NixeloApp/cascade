import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
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

  const team = useQuery(api.teams.getBySlug, {
    organizationId: organizationId,
    slug: teamSlug,
  });

  // Redirect to projects list
  useEffect(() => {
    if (team) {
      navigate({
        to: ROUTES.workspaces.teams.projects.list.path,
        params: { orgSlug, workspaceSlug, teamSlug },
        replace: true,
      });
    }
  }, [team, orgSlug, workspaceSlug, teamSlug, navigate]);

  return null;
}
