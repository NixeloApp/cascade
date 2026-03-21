import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PageControls, PageHeader, PageLayout, PageStack } from "@/components/layout";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { RouteNav, RouteNavItem } from "@/components/ui/RouteNav";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug",
)({
  component: TeamLayout,
});

/** Team detail shell with shared header and section navigation rhythm. */
export function TeamLayout() {
  const { organizationId, orgSlug } = useOrganization();
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
      <PageStack>
        <PageHeader
          title={team.name}
          description={team.description ?? undefined}
          spacing="stack"
          breadcrumbs={[
            { label: "Workspaces", to: ROUTES.workspaces.list.build(orgSlug) },
            { label: workspace.name, to: ROUTES.workspaces.detail.build(orgSlug, workspaceSlug) },
            { label: team.name },
          ]}
        />

        <PageControls padding="sm" spacing="stack">
          <RouteNav aria-label="Team sections">
            <RouteNavItem asChild>
              <Link
                to={ROUTES.workspaces.teams.detail.path}
                params={{ orgSlug, workspaceSlug, teamSlug }}
                activeOptions={{ exact: true }}
                activeProps={{ "aria-current": "page" }}
              >
                Projects
              </Link>
            </RouteNavItem>
            <RouteNavItem asChild>
              <Link
                to={ROUTES.workspaces.teams.calendar.path}
                params={{ orgSlug, workspaceSlug, teamSlug }}
                activeProps={{ "aria-current": "page" }}
              >
                Calendar
              </Link>
            </RouteNavItem>
            <RouteNavItem asChild>
              <Link
                to={ROUTES.workspaces.teams.wiki.path}
                params={{ orgSlug, workspaceSlug, teamSlug }}
                activeProps={{ "aria-current": "page" }}
              >
                Wiki
              </Link>
            </RouteNavItem>
            <RouteNavItem asChild>
              <Link
                to={ROUTES.workspaces.teams.settings.path}
                params={{ orgSlug, workspaceSlug, teamSlug }}
                activeProps={{ "aria-current": "page" }}
              >
                Settings
              </Link>
            </RouteNavItem>
          </RouteNav>
        </PageControls>

        <Outlet />
      </PageStack>
    </PageLayout>
  );
}
