import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/KanbanBoard";
import { PageContent } from "@/components/layout";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/board",
)({
  component: TeamBoardPage,
});

function TeamBoardPage() {
  const { organizationId } = useOrganization();
  const { workspaceSlug, teamSlug } = Route.useParams();

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

  if (!team) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  return <KanbanBoard teamId={team._id} />;
}
