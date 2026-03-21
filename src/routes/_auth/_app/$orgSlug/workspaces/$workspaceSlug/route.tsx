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
export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug")({
  component: WorkspaceLayout,
});

/** Workspace detail shell with shared header and section navigation rhythm. */
export function WorkspaceLayout() {
  const { organizationId, orgSlug } = useOrganization();
  const { workspaceSlug } = Route.useParams();

  const workspace = useAuthenticatedQuery(api.workspaces.getBySlug, {
    organizationId: organizationId,
    slug: workspaceSlug,
  });

  if (workspace === undefined) {
    return (
      <Flex direction="column" align="center" justify="center" className="min-h-96">
        <LoadingSpinner />
      </Flex>
    );
  }

  if (workspace === null) {
    return (
      <PageLayout>
        <Typography variant="h2">Workspace not found</Typography>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageStack>
        <PageHeader
          title={workspace.name}
          description={workspace.description ?? undefined}
          spacing="stack"
          breadcrumbs={[
            { label: "Workspaces", to: ROUTES.workspaces.list.build(orgSlug) },
            { label: workspace.name },
          ]}
        />

        <PageControls padding="sm" spacing="stack">
          <RouteNav aria-label="Workspace sections">
            <RouteNavItem asChild>
              <Link
                to={ROUTES.workspaces.detail.path}
                params={{ orgSlug, workspaceSlug }}
                activeOptions={{ exact: true }}
                activeProps={{ "aria-current": "page" }}
              >
                Teams
              </Link>
            </RouteNavItem>
            <RouteNavItem asChild>
              <Link
                to={ROUTES.workspaces.backlog.path}
                params={{ orgSlug, workspaceSlug }}
                activeProps={{ "aria-current": "page" }}
              >
                Backlog
              </Link>
            </RouteNavItem>
            <RouteNavItem asChild>
              <Link
                to={ROUTES.workspaces.sprints.path}
                params={{ orgSlug, workspaceSlug }}
                activeProps={{ "aria-current": "page" }}
              >
                Sprints
              </Link>
            </RouteNavItem>
            <RouteNavItem asChild>
              <Link
                to={ROUTES.workspaces.dependencies.path}
                params={{ orgSlug, workspaceSlug }}
                activeProps={{ "aria-current": "page" }}
              >
                Dependencies
              </Link>
            </RouteNavItem>
            <RouteNavItem asChild>
              <Link
                to={ROUTES.workspaces.calendar.path}
                params={{ orgSlug, workspaceSlug }}
                activeProps={{ "aria-current": "page" }}
              >
                Calendar
              </Link>
            </RouteNavItem>
            <RouteNavItem asChild>
              <Link
                to={ROUTES.workspaces.wiki.path}
                params={{ orgSlug, workspaceSlug }}
                activeProps={{ "aria-current": "page" }}
              >
                Wiki
              </Link>
            </RouteNavItem>
            <RouteNavItem asChild>
              <Link
                to={ROUTES.workspaces.settings.path}
                params={{ orgSlug, workspaceSlug }}
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
