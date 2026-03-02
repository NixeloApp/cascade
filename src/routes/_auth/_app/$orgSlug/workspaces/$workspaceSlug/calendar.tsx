import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { CalendarView } from "@/components/Calendar/CalendarView";
import { PageContent, PageError } from "@/components/layout";
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

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/calendar")({
  component: WorkspaceCalendarPage,
});

function WorkspaceCalendarPage() {
  const { organizationId } = useOrganization();
  const { workspaceSlug } = Route.useParams();
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | "all">("all");

  const workspace = useQuery(api.workspaces.getBySlug, {
    organizationId,
    slug: workspaceSlug,
  });
  const teams = useQuery(api.teams.getOrganizationTeams, { organizationId });

  if (workspace === undefined || teams === undefined) {
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

  const workspaceTeams = teams.filter((team) => team.workspaceId === workspace._id);

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
            {workspaceTeams.map((team) => (
              <SelectItem key={team._id} value={team._id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Flex>
      <CalendarView
        workspaceId={workspace._id}
        teamId={selectedTeamId === "all" ? undefined : selectedTeamId}
      />
    </Flex>
  );
}
