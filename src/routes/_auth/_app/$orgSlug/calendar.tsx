import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { CalendarView } from "@/components/Calendar/CalendarView";
import { PageContent } from "@/components/layout";
import { Flex } from "@/components/ui/Flex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Typography } from "@/components/ui/Typography";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute("/_auth/_app/$orgSlug/calendar")({
  component: OrganizationCalendarPage,
});

function OrganizationCalendarPage() {
  const { organizationId } = useOrganization();
  const workspaces = useQuery(api.workspaces.list, { organizationId });
  const teams = useQuery(api.teams.getOrganizationTeams, { organizationId });
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
    <Flex direction="column" className="h-full">
      <Flex
        align="center"
        justify="between"
        className="gap-3 p-3 sm:p-4 border-b border-ui-border bg-ui-bg"
      >
        <Typography variant="label" color="secondary">
          {scopeLabel}
        </Typography>
        <Flex gap="sm" className="w-full sm:w-auto">
          <Select
            value={selectedWorkspaceId}
            onValueChange={(value) => {
              setSelectedWorkspaceId(value as Id<"workspaces"> | "all");
              setSelectedTeamId("all");
            }}
          >
            <SelectTrigger className="w-full sm:w-56 bg-ui-bg">
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
            <SelectTrigger className="w-full sm:w-56 bg-ui-bg">
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
      </Flex>
      <CalendarView
        organizationId={organizationId}
        workspaceId={selectedWorkspaceId === "all" ? undefined : selectedWorkspaceId}
        teamId={selectedTeamId === "all" ? undefined : selectedTeamId}
        colorByScope={colorByScope}
      />
    </Flex>
  );
}
