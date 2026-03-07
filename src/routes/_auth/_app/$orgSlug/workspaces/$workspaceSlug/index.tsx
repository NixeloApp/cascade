import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/")({
  component: WorkspaceHome,
});

function WorkspaceHome() {
  const { organizationId, orgSlug } = useOrganization();
  const { workspaceSlug } = Route.useParams();
  const navigate = useNavigate();

  const workspace = useAuthenticatedQuery(api.workspaces.getBySlug, {
    organizationId: organizationId,
    slug: workspaceSlug,
  });

  // Redirect to teams list
  useEffect(() => {
    if (workspace) {
      navigate({
        to: ROUTES.workspaces.teams.list.path,
        params: { orgSlug, workspaceSlug },
        replace: true,
      });
    }
  }, [workspace, orgSlug, workspaceSlug, navigate]);

  return null;
}
