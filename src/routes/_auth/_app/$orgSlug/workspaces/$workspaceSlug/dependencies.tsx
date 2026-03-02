import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { PageContent, PageError } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
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
import { LinkIcon } from "@/lib/icons";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/dependencies")(
  {
    component: WorkspaceDependenciesPage,
  },
);

function WorkspaceDependenciesPage() {
  const { organizationId } = useOrganization();
  const { workspaceSlug } = Route.useParams();
  const [teamId, setTeamId] = useState<Id<"teams"> | "all">("all");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");

  const workspace = useQuery(api.workspaces.getBySlug, {
    organizationId,
    slug: workspaceSlug,
  });
  const teams = useQuery(api.teams.getOrganizationTeams, { organizationId });
  const dependencies = useQuery(
    api.workspaces.getCrossTeamDependencies,
    workspace
      ? {
          workspaceId: workspace._id,
          teamId: teamId === "all" ? undefined : teamId,
          status: status === "all" ? undefined : status,
          priority: priority === "all" ? undefined : priority,
        }
      : "skip",
  );

  const workspaceTeams = useMemo(() => {
    if (!(workspace && teams)) {
      return [];
    }
    return teams.filter((team) => team.workspaceId === workspace._id);
  }, [workspace, teams]);

  const statusOptions = useMemo(() => {
    if (!dependencies) {
      return [];
    }
    return [
      ...new Set(dependencies.flatMap((dep) => [dep.fromIssue.status, dep.toIssue.status])),
    ].sort();
  }, [dependencies]);

  const priorityOptions = useMemo(() => {
    if (!dependencies) {
      return [];
    }
    return [
      ...new Set(dependencies.flatMap((dep) => [dep.fromIssue.priority, dep.toIssue.priority])),
    ].sort();
  }, [dependencies]);

  if (workspace === undefined || teams === undefined || dependencies === undefined) {
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

  if (dependencies.length === 0) {
    return (
      <Flex direction="column" gap="lg">
        <DependencyFilters
          workspaceTeams={workspaceTeams}
          teamId={teamId}
          setTeamId={setTeamId}
          status={status}
          setStatus={setStatus}
          statusOptions={statusOptions}
          priority={priority}
          setPriority={setPriority}
          priorityOptions={priorityOptions}
        />
        <EmptyState
          icon={LinkIcon}
          title="No cross-team blockers"
          description="No cross-team 'blocks' relationships were found for this workspace."
        />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="lg">
      <DependencyFilters
        workspaceTeams={workspaceTeams}
        teamId={teamId}
        setTeamId={setTeamId}
        status={status}
        setStatus={setStatus}
        statusOptions={statusOptions}
        priority={priority}
        setPriority={setPriority}
        priorityOptions={priorityOptions}
      />
      <Flex direction="column" gap="md">
        {dependencies.map((dependency) => (
          <div key={dependency.linkId} className="rounded-lg border border-ui-border bg-ui-bg p-4">
            <Flex direction="column" gap="sm">
              <Flex justify="between" align="center">
                <Badge variant="secondary">Blocks</Badge>
                <Typography variant="small" color="secondary">
                  {dependency.fromIssue.teamName} {"->"} {dependency.toIssue.teamName}
                </Typography>
              </Flex>
              <Flex align="start" gap="sm" className="text-sm">
                <Typography variant="small" className="font-medium">
                  {dependency.fromIssue.key}
                </Typography>
                <Typography variant="small" color="secondary" className="line-clamp-1">
                  {dependency.fromIssue.title}
                </Typography>
              </Flex>
              <Flex align="center" gap="sm" className="text-ui-text-tertiary">
                <LinkIcon className="size-4" />
              </Flex>
              <Flex align="start" gap="sm" className="text-sm">
                <Typography variant="small" className="font-medium">
                  {dependency.toIssue.key}
                </Typography>
                <Typography variant="small" color="secondary" className="line-clamp-1">
                  {dependency.toIssue.title}
                </Typography>
              </Flex>
            </Flex>
          </div>
        ))}
      </Flex>
    </Flex>
  );
}

type DependencyFiltersProps = {
  workspaceTeams: Array<{
    _id: Id<"teams">;
    name: string;
  }>;
  teamId: Id<"teams"> | "all";
  setTeamId: (value: Id<"teams"> | "all") => void;
  status: string;
  setStatus: (value: string) => void;
  statusOptions: string[];
  priority: string;
  setPriority: (value: string) => void;
  priorityOptions: string[];
};

function DependencyFilters({
  workspaceTeams,
  teamId,
  setTeamId,
  status,
  setStatus,
  statusOptions,
  priority,
  setPriority,
  priorityOptions,
}: DependencyFiltersProps) {
  return (
    <Flex align="center" gap="sm" className="flex-wrap">
      <Select value={teamId} onValueChange={(value) => setTeamId(value as Id<"teams"> | "all")}>
        <SelectTrigger className="w-full sm:w-52 bg-ui-bg">
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

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-full sm:w-44 bg-ui-bg">
          <SelectValue placeholder="Any status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any status</SelectItem>
          {statusOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priority} onValueChange={setPriority}>
        <SelectTrigger className="w-full sm:w-44 bg-ui-bg">
          <SelectValue placeholder="Any priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any priority</SelectItem>
          {priorityOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Flex>
  );
}
