import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PageHeader, PageLayout } from "@/components/Layout";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug",
)({
  component: TeamLayout,
});

function TeamLayout() {
  const { organizationId, orgSlug } = useOrganization();
  const { workspaceSlug, teamSlug } = Route.useParams();

  const workspace = useQuery(api.workspaces.getBySlug, {
    organizationId,
    slug: workspaceSlug,
  });

  const team = useQuery(
    api.teams.getBySlug,
    workspace?._id
      ? {
          workspaceId: workspace._id,
          slug: teamSlug,
        }
      : "skip",
  );

  if (workspace === undefined || team === undefined) {
    return (
      <Flex direction="column" align="center" justify="center" className="min-h-96">
        <LoadingSpinner />
      </Flex>
    );
  }

  if (!(workspace && team)) {
    return (
      <PageLayout>
        <Typography variant="h2">Team not found</Typography>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={team.name}
        description={team.description ?? undefined}
        breadcrumbs={[
          { label: "Workspaces", to: ROUTES.workspaces.list.build(orgSlug) },
          { label: workspace.name, to: ROUTES.workspaces.detail.build(orgSlug, workspaceSlug) },
          { label: team.name },
        ]}
      />

      {/* Tabs */}
      <div className="border-b border-ui-border mb-6">
        <nav className="flex gap-6">
          <Link
            to={ROUTES.workspaces.teams.detail.path}
            params={{ orgSlug, workspaceSlug, teamSlug }}
            className="px-1 py-3 border-b-2 border-brand font-medium text-brand"
          >
            Projects
          </Link>
          <Link
            to={ROUTES.workspaces.teams.calendar.path}
            params={{ orgSlug, workspaceSlug, teamSlug }}
            className="px-1 py-3 border-b-2 border-transparent hover:border-ui-border-secondary text-ui-text-secondary hover:text-ui-text"
          >
            Calendar
          </Link>
          <Link
            to={ROUTES.workspaces.teams.settings.path}
            params={{ orgSlug, workspaceSlug, teamSlug }}
            className="px-1 py-3 border-b-2 border-transparent hover:border-ui-border-secondary text-ui-text-secondary hover:text-ui-text"
          >
            Settings
          </Link>
        </nav>
      </div>

      {/* Content */}
      <Outlet />
    </PageLayout>
  );
}
