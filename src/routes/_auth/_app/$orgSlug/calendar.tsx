import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";

const CalendarView = lazy(() =>
  import("@/components/Calendar/CalendarView").then((m) => ({ default: m.CalendarView })),
);

import { Flex } from "@/components/ui/Flex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";

interface CalendarSearchParams {
  workspace?: string;
  team?: string;
}

export const Route = createFileRoute("/_auth/_app/$orgSlug/calendar")({
  component: OrganizationCalendarPage,
  validateSearch: (search: Record<string, unknown>): CalendarSearchParams => ({
    workspace: typeof search.workspace === "string" ? search.workspace : undefined,
    team: typeof search.team === "string" ? search.team : undefined,
  }),
});

function OrganizationCalendarPage() {
  const { organizationId } = useOrganization();
  const { workspace: workspaceParam, team: teamParam } = Route.useSearch();
  const navigate = Route.useNavigate();

  const workspaces = useAuthenticatedQuery(api.workspaces.list, { organizationId });
  const teams = useAuthenticatedQuery(api.teams.getOrganizationTeams, { organizationId });

  const selectedWorkspaceId: Id<"workspaces"> | "all" =
    (workspaceParam as Id<"workspaces">) || "all";
  const selectedTeamId: Id<"teams"> | "all" = (teamParam as Id<"teams">) || "all";

  const setSelectedWorkspaceId = (value: Id<"workspaces"> | "all") => {
    navigate({
      search: {
        workspace: value === "all" ? undefined : value,
        team: undefined, // reset team when workspace changes
      },
    });
  };

  const setSelectedTeamId = (value: Id<"teams"> | "all") => {
    navigate({
      search: (prev) => ({
        ...prev,
        team: value === "all" ? undefined : value,
      }),
    });
  };

  if (workspaces === undefined || teams === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  const workspaceTeams =
    selectedWorkspaceId === "all"
      ? teams
      : teams.filter((team) => team.workspaceId === selectedWorkspaceId);

  const scopeLabel =
    selectedTeamId !== "all"
      ? "Team scope"
      : selectedWorkspaceId !== "all"
        ? "Workspace scope"
        : "Organization scope";
  const colorByScope =
    selectedTeamId !== "all" ? undefined : selectedWorkspaceId !== "all" ? "team" : "workspace";

  return (
    <PageLayout fullHeight>
      <PageHeader
        title={scopeLabel}
        actions={
          <Flex gap="sm" className="w-full sm:w-auto">
            <Select
              value={selectedWorkspaceId}
              onValueChange={(value) => setSelectedWorkspaceId(value as Id<"workspaces"> | "all")}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="All workspaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workspaces</SelectItem>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace._id} value={workspace._id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedTeamId}
              onValueChange={(value) => setSelectedTeamId(value as Id<"teams"> | "all")}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teams</SelectItem>
                {workspaceTeams.map((team) => (
                  <SelectItem key={team._id} value={team._id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Flex>
        }
      />
      <Suspense fallback={<PageContent isLoading>{null}</PageContent>}>
        <CalendarView
          organizationId={organizationId}
          workspaceId={selectedWorkspaceId === "all" ? undefined : selectedWorkspaceId}
          teamId={selectedTeamId === "all" ? undefined : selectedTeamId}
          colorByScope={colorByScope}
        />
      </Suspense>
    </PageLayout>
  );
}
