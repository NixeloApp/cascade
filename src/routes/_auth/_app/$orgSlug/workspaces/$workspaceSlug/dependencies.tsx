import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContent } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Stack } from "@/components/ui/Stack";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { LinkIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useWorkspaceLayout } from "./route";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/dependencies")(
  {
    component: WorkspaceDependenciesPage,
  },
);

// =============================================================================
// Types
// =============================================================================

interface Dependency {
  linkId: string;
  fromIssue: {
    key: string;
    title: string;
    status: string;
    priority: string;
    teamName: string;
    teamId: Id<"teams">;
  };
  toIssue: {
    key: string;
    title: string;
    status: string;
    priority: string;
    teamName: string;
    teamId: Id<"teams">;
  };
}

// =============================================================================
// Matrix Logic
// =============================================================================

interface MatrixCell {
  count: number;
  fromTeam: string;
  toTeam: string;
}

function buildDependencyMatrix(
  dependencies: Dependency[],
  teams: Array<{ _id: Id<"teams">; name: string }>,
): { teamNames: string[]; cells: MatrixCell[][] } {
  const involvedTeamIds = new Set<string>();

  for (const dep of dependencies) {
    involvedTeamIds.add(dep.fromIssue.teamId);
    involvedTeamIds.add(dep.toIssue.teamId);
  }

  const orderedTeams = teams.filter((t) => involvedTeamIds.has(t._id));
  const teamNames = orderedTeams.map((t) => t.name);
  const teamIndexMap = new Map(orderedTeams.map((t, i) => [t._id, i]));

  const size = orderedTeams.length;
  const cells: MatrixCell[][] = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
      count: 0,
      fromTeam: teamNames[row],
      toTeam: teamNames[col],
    })),
  );

  for (const dep of dependencies) {
    const fromIdx = teamIndexMap.get(dep.fromIssue.teamId);
    const toIdx = teamIndexMap.get(dep.toIssue.teamId);
    if (fromIdx !== undefined && toIdx !== undefined) {
      cells[fromIdx][toIdx].count++;
    }
  }

  return { teamNames, cells };
}

function getCellIntensity(count: number, maxCount: number): string {
  if (count === 0) return "bg-transparent";
  const ratio = maxCount > 0 ? count / maxCount : 0;
  if (ratio <= 0.25) return "bg-status-warning/20";
  if (ratio <= 0.5) return "bg-status-warning/40";
  if (ratio <= 0.75) return "bg-status-error/30";
  return "bg-status-error/50";
}

// =============================================================================
// Matrix Cell
// =============================================================================

function MatrixCellView({
  cell,
  isDiagonal,
  maxCount,
}: {
  cell: MatrixCell;
  isDiagonal: boolean;
  maxCount: number;
}) {
  if (isDiagonal) {
    return (
      <td className="p-1">
        <Flex
          align="center"
          justify="center"
          className="size-10 bg-ui-bg-soft text-ui-text-tertiary"
        >
          <Typography variant="caption">—</Typography>
        </Flex>
      </td>
    );
  }

  const tooltipText =
    cell.count > 0
      ? `${cell.fromTeam} blocks ${cell.toTeam}: ${cell.count} issue${cell.count !== 1 ? "s" : ""}`
      : `${cell.fromTeam} does not block ${cell.toTeam}`;

  return (
    <td className="p-1">
      <Tooltip content={tooltipText}>
        <div
          className={cn(
            "flex size-10 cursor-default items-center justify-center border border-ui-border/50 transition-colors",
            getCellIntensity(cell.count, maxCount),
          )}
        >
          <Typography variant="mono" color={cell.count > 0 ? undefined : "tertiary"}>
            {cell.count}
          </Typography>
        </div>
      </Tooltip>
    </td>
  );
}

// =============================================================================
// Matrix Component
// =============================================================================

function DependencyMatrix({
  dependencies,
  teams,
}: {
  dependencies: Dependency[];
  teams: Array<{ _id: Id<"teams">; name: string }>;
}) {
  const { teamNames, cells } = useMemo(
    () => buildDependencyMatrix(dependencies, teams),
    [dependencies, teams],
  );

  if (teamNames.length < 2) return null;

  const maxCount = Math.max(1, ...cells.flat().map((c) => c.count));

  return (
    <Card padding="md">
      <Stack gap="sm">
        <Typography variant="h5">Cross-Team Blocker Matrix</Typography>
        <Typography variant="small" color="secondary">
          Rows block columns. Darker cells indicate more blocking relationships.
        </Typography>

        <div className="overflow-x-auto">
          <table className="w-auto border-collapse text-sm" aria-label="Dependency matrix">
            <thead>
              <tr>
                <th className="p-2 text-left text-ui-text-tertiary" aria-label="From team" />
                {teamNames.map((name) => (
                  <th key={name} className="p-2 text-center font-medium text-ui-text-secondary">
                    <Typography variant="caption" className="max-w-20 truncate">
                      {name}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cells.map((row, rowIdx) => (
                <tr key={teamNames[rowIdx]}>
                  <td className="p-2 pr-3 text-right font-medium text-ui-text-secondary">
                    <Typography variant="caption" className="max-w-24 truncate">
                      {teamNames[rowIdx]}
                    </Typography>
                  </td>
                  {row.map((cell) => (
                    <MatrixCellView
                      key={`${cell.fromTeam}-${cell.toTeam}`}
                      cell={cell}
                      isDiagonal={cell.fromTeam === cell.toTeam}
                      maxCount={maxCount}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Stack>
    </Card>
  );
}

// =============================================================================
// Main Page
// =============================================================================

function WorkspaceDependenciesPage() {
  const { organizationId } = useOrganization();
  const { workspaceId } = useWorkspaceLayout();
  const [teamId, setTeamId] = useState<Id<"teams"> | "all">("all");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");

  const workspaceTeams = useAuthenticatedQuery(api.teams.getOrganizationTeams, {
    organizationId,
    workspaceId,
  });
  const dependencies = useAuthenticatedQuery(api.workspaces.getCrossTeamDependencies, {
    workspaceId,
    teamId: teamId === "all" ? undefined : teamId,
    status: status === "all" ? undefined : status,
    priority: priority === "all" ? undefined : priority,
  });

  const statusOptions = dependencies
    ? [...new Set(dependencies.flatMap((dep) => [dep.fromIssue.status, dep.toIssue.status]))].sort()
    : [];

  const priorityOptions = dependencies
    ? [
        ...new Set(dependencies.flatMap((dep) => [dep.fromIssue.priority, dep.toIssue.priority])),
      ].sort()
    : [];

  if (workspaceTeams === undefined || dependencies === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  if (dependencies.length === 0) {
    return (
      <Stack gap="lg">
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
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
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

      <DependencyMatrix dependencies={dependencies as Dependency[]} teams={workspaceTeams} />

      <Stack gap="md">
        <Typography variant="h5">
          {dependencies.length} blocker{dependencies.length !== 1 ? "s" : ""}
        </Typography>
        {dependencies.map((dependency) => (
          <Card key={dependency.linkId} padding="md">
            <Flex direction="column" gap="sm">
              <Flex justify="between" align="center">
                <Badge variant="secondary">Blocks</Badge>
                <Typography variant="small" color="secondary">
                  {dependency.fromIssue.teamName} {"->"} {dependency.toIssue.teamName}
                </Typography>
              </Flex>
              <Flex align="start" gap="sm" className="text-sm">
                <Typography variant="label">{dependency.fromIssue.key}</Typography>
                <Typography variant="small" color="secondary" className="line-clamp-1">
                  {dependency.fromIssue.title}
                </Typography>
              </Flex>
              <Flex align="center" gap="sm" className="text-ui-text-tertiary">
                <LinkIcon className="size-4" />
              </Flex>
              <Flex align="start" gap="sm" className="text-sm">
                <Typography variant="label">{dependency.toIssue.key}</Typography>
                <Typography variant="small" color="secondary" className="line-clamp-1">
                  {dependency.toIssue.title}
                </Typography>
              </Flex>
            </Flex>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}

// =============================================================================
// Filters
// =============================================================================

type DependencyFiltersProps = {
  workspaceTeams: Array<{ _id: Id<"teams">; name: string }>;
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
    <Flex align="center" gap="sm" wrap>
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
