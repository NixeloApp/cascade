import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { createContext, useContext } from "react";
import { PageControls, PageHeader, PageLayout, PageStack } from "@/components/layout";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { RouteNav, RouteNavItem } from "@/components/ui/RouteNav";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";

// Context for child routes to access workspace data without re-querying
interface WorkspaceLayoutContextValue {
  workspaceId: Id<"workspaces">;
}

const WorkspaceLayoutContext = createContext<WorkspaceLayoutContextValue | null>(null);

/** Use workspace data from the parent layout. Avoids duplicate getBySlug queries. */
export function useWorkspaceLayout(): WorkspaceLayoutContextValue {
  const ctx = useContext(WorkspaceLayoutContext);
  if (!ctx) throw new Error("useWorkspaceLayout must be used within WorkspaceLayout");
  return ctx;
}

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug")({
  component: WorkspaceLayout,
});

/** Workspace detail shell with shared header and section navigation rhythm. */
export function WorkspaceLayout() {
  const { organizationId, orgSlug } = useOrganization();
  const { workspaceSlug } = Route.useParams();
  const location = useLocation();

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

  const isNestedTeamRoute = location.pathname.includes(`/workspaces/${workspaceSlug}/teams/`);

  return (
    <PageLayout>
      <PageStack>
        {isNestedTeamRoute ? (
          <PageControls tone="strip" padding="sm" gap="sm" spacing="stack">
            <Flex align="center" gap="xs" wrap className="min-w-0">
              <Typography variant="eyebrowWide">Workspace sections</Typography>
              <Typography variant="label" className="min-w-0 truncate">
                {workspace.name}
              </Typography>
            </Flex>
            <WorkspaceSectionsNav orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
          </PageControls>
        ) : (
          <>
            <PageHeader
              title={workspace.name}
              description={workspace.description ?? undefined}
              spacing="stack"
              breadcrumbs={[
                { label: "Workspaces", to: ROUTES.workspaces.list.build(orgSlug) },
                { label: workspace.name },
              ]}
            />

            <PageControls tone="strip" padding="sm" gap="sm" spacing="stack">
              <WorkspaceSectionsNav orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
            </PageControls>
          </>
        )}

        <WorkspaceLayoutContext.Provider value={{ workspaceId: workspace._id }}>
          <Outlet />
        </WorkspaceLayoutContext.Provider>
      </PageStack>
    </PageLayout>
  );
}

interface WorkspaceSectionsNavProps {
  orgSlug: string;
  workspaceSlug: string;
}

function WorkspaceSectionsNav({ orgSlug, workspaceSlug }: WorkspaceSectionsNavProps) {
  return (
    <Stack gap="none">
      <RouteNav size="sm" mobileLayout="wrap" aria-label="Workspace sections">
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
    </Stack>
  );
}
