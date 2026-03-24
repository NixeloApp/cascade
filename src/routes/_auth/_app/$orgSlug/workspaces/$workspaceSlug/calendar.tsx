import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarView } from "@/components/Calendar/CalendarView";
import { Flex } from "@/components/ui/Flex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { useWorkspaceLayout } from "./route";
export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/calendar")({
  component: WorkspaceCalendarPage,
});

function WorkspaceCalendarPage() {
  const { organizationId } = useOrganization();
  const { workspaceId } = useWorkspaceLayout();
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | "all">("all");

  const workspaceTeams = useAuthenticatedQuery(api.teams.getOrganizationTeams, {
    organizationId,
    workspaceId,
  });

  return (
    <Flex direction="column" className="h-full">
      <Flex
        align="center"
        justify="between"
        className="gap-3 p-3 sm:p-4 border-b border-ui-border bg-ui-bg"
      >
        <Typography variant="label" color="secondary">
          Workspace scope
        </Typography>
        <Select
          value={selectedTeamId}
          onValueChange={(value) => setSelectedTeamId(value as Id<"teams"> | "all")}
        >
          <SelectTrigger className="w-full sm:w-56 bg-ui-bg">
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {(workspaceTeams ?? []).map((team) => (
              <SelectItem key={team._id} value={team._id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Flex>
      <CalendarView
        workspaceId={workspaceId}
        teamId={selectedTeamId === "all" ? undefined : selectedTeamId}
        colorByScope={selectedTeamId === "all" ? "team" : undefined}
      />
    </Flex>
  );
}
