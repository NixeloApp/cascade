import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarView } from "@/components/Calendar/CalendarView";
import { PageContent, PageError } from "@/components/layout";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar",
)({
  component: TeamCalendarPage,
});

function TeamCalendarPage() {
  const { organizationId } = useOrganization();
  const { workspaceSlug, teamSlug } = Route.useParams();

  const workspace = useAuthenticatedQuery(api.workspaces.getBySlug, {
    organizationId,
    slug: workspaceSlug,
  });
  const team = useAuthenticatedQuery(
    api.teams.getBySlug,
    workspace ? { workspaceId: workspace._id, slug: teamSlug } : "skip",
  );

  if (workspace === undefined || team === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  if (!workspace) {
    return (
      <PageError
        title="Workspace Not Found"
        message={`The workspace "${workspaceSlug}" doesn't exist or you don't have access to it.`}
      />
    );
  }

  if (!team) {
    return (
      <PageError
        title="Team Not Found"
        message={`The team "${teamSlug}" doesn't exist or you don't have access to it.`}
      />
    );
  }

  return <CalendarView teamId={team._id} />;
}
