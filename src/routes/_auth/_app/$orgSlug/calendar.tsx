import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
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
export const Route = createFileRoute("/_auth/_app/$orgSlug/calendar")({
  component: OrganizationCalendarPage,
});

function OrganizationCalendarPage() {
  const { organizationId } = useOrganization();
  const workspaces = useAuthenticatedQuery(api.workspaces.list, { organizationId });
  const teams = useAuthenticatedQuery(api.teams.getOrganizationTeams, { organizationId });
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<Id<"workspaces"> | "all">("all");
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | "all">("all");

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
              onValueChange={(value) => {
                setSelectedWorkspaceId(value as Id<"workspaces"> | "all");
                setSelectedTeamId("all");
              }}
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
