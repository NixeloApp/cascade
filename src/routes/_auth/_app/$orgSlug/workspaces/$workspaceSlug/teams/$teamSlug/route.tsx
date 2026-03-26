import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { createContext, useContext } from "react";
import { PageControls, PageHeader, PageLayout, PageStack } from "@/components/layout";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { RouteNav, RouteNavItem } from "@/components/ui/RouteNav";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";

// Context for child routes to access team data without re-querying
interface TeamLayoutContextValue {
  teamId: Id<"teams">;
  teamName: string;
  workspaceId: Id<"workspaces">;
  workspaceName: string;
  workspaceSlug: string;
}

const TeamLayoutContext = createContext<TeamLayoutContextValue | null>(null);

/** Hook for child routes to access parent-resolved team/workspace data. */
export function useTeamLayout(): TeamLayoutContextValue {
  const ctx = useContext(TeamLayoutContext);
  if (!ctx) throw new Error("useTeamLayout must be used within TeamLayout");
  return ctx;
}
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

  const members = useAuthenticatedQuery(
    api.teams.getTeamMembers,
    team?._id ? { teamId: team._id } : "skip",
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

  const teamLayoutValue: TeamLayoutContextValue = {
    teamId: team._id,
    teamName: team.name,
    workspaceId: workspace._id,
    workspaceName: workspace.name,
    workspaceSlug,
  };

  return (
    <TeamLayoutContext.Provider value={teamLayoutValue}>
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
            actions={
              members && members.length > 0 ? (
                <>
                  <Flex gap="xs">
                    {members.slice(0, 6).map((member) => (
                      <Tooltip key={member._id} content={member.user?.name ?? "Team member"}>
                        <Avatar name={member.user?.name} src={member.user?.image} size="xs" />
                      </Tooltip>
                    ))}
                  </Flex>
                  {members.length > 6 && (
                    <Badge variant="neutral" size="sm">
                      +{members.length - 6}
                    </Badge>
                  )}
                  <Typography variant="caption" color="tertiary">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                  </Typography>
                </>
              ) : undefined
            }
          />

          <PageControls tone="strip" padding="sm" gap="sm" spacing="stack">
            <RouteNav size="sm" aria-label="Team sections">
              <RouteNavItem asChild>
                <Link
                  to={ROUTES.workspaces.teams.detail.path}
                  params={{ orgSlug, workspaceSlug, teamSlug }}
                  activeOptions={{ exact: true }}
                  activeProps={{ "aria-current": "page" }}
                >
                  Board
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
    </TeamLayoutContext.Provider>
  );
}
