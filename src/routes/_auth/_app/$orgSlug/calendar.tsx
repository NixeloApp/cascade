import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";
import { PageHeader, PageLayout } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { CardSection } from "@/components/ui/CardSection";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";

const CalendarView = lazy(() =>
  import("@/components/Calendar/CalendarView").then((m) => ({ default: m.CalendarView })),
);

declare global {
  interface Window {
    __NIXELO_E2E_ORG_CALENDAR_LOADING__?: boolean;
  }
}

interface CalendarSearchParams {
  workspace?: string;
  team?: string;
}

type WorkspaceSummary = {
  _id: Id<"workspaces">;
  name: string;
};

type TeamSummary = {
  _id: Id<"teams">;
  name: string;
};

type CalendarSelectionState = {
  canSelectTeam: boolean;
  selectedTeamId: Id<"teams"> | "all";
  selectedWorkspaceId: Id<"workspaces"> | "all";
  workspaceTeams: TeamSummary[];
};

function isE2EOrgCalendarLoadingOverrideEnabled(): boolean {
  return typeof window !== "undefined" && window.__NIXELO_E2E_ORG_CALENDAR_LOADING__ === true;
}

function OrganizationCalendarSkeletonActions() {
  return (
    <Flex gap="sm" className="w-full sm:w-auto">
      <Skeleton className="h-10 w-full sm:w-56" />
      <Skeleton className="h-10 w-full sm:w-56" />
    </Flex>
  );
}

function OrganizationCalendarLoadingBody() {
  const skeletonCells = Array.from({ length: 35 }, (_, index) => `org-calendar-skeleton-${index}`);

  return (
    <Card
      data-testid={TEST_IDS.ORG_CALENDAR.LOADING_STATE}
      variant="subtle"
      padding="md"
      radius="md"
      className="h-full"
    >
      <Flex direction="column" gap="lg" className="h-full">
        <Flex align="center" justify="between" className="gap-3">
          <Skeleton className="h-10 w-40" />
          <Flex align="center" gap="sm">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </Flex>
        </Flex>
        <FlexItem flex="1">
          <Grid cols={7} gap="sm" className="h-full">
            {skeletonCells.map((cellId) => (
              <CardSection key={cellId} size="compact">
                <Skeleton className="mb-3 h-3 w-10" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </CardSection>
            ))}
          </Grid>
        </FlexItem>
      </Flex>
    </Card>
  );
}

function OrganizationCalendarLoadingState() {
  return (
    <PageLayout fullHeight>
      <PageHeader title="Organization scope" actions={<OrganizationCalendarSkeletonActions />} />
      <OrganizationCalendarLoadingBody />
    </PageLayout>
  );
}

function getCalendarSelectionState(args: {
  requestedTeamId?: Id<"teams">;
  requestedWorkspaceId?: Id<"workspaces">;
  teams: TeamSummary[] | undefined;
  workspaces: WorkspaceSummary[] | undefined;
}): CalendarSelectionState {
  const selectedWorkspaceId: Id<"workspaces"> | "all" =
    args.requestedWorkspaceId &&
    args.workspaces?.some((workspace) => workspace._id === args.requestedWorkspaceId)
      ? args.requestedWorkspaceId
      : "all";
  const canSelectTeam = selectedWorkspaceId !== "all";
  const workspaceTeams = canSelectTeam ? (args.teams ?? []) : [];
  const selectedTeamId: Id<"teams"> | "all" =
    canSelectTeam &&
    args.requestedTeamId &&
    workspaceTeams.some((team) => team._id === args.requestedTeamId)
      ? args.requestedTeamId
      : "all";

  return {
    canSelectTeam,
    selectedTeamId,
    selectedWorkspaceId,
    workspaceTeams,
  };
}

function getCalendarScopePresentation(selection: {
  selectedTeamId: Id<"teams"> | "all";
  selectedWorkspaceId: Id<"workspaces"> | "all";
}): {
  colorByScope: "workspace" | "team" | undefined;
  scopeLabel: "Organization scope" | "Team scope" | "Workspace scope";
} {
  if (selection.selectedTeamId !== "all") {
    return {
      colorByScope: undefined,
      scopeLabel: "Team scope",
    };
  }

  if (selection.selectedWorkspaceId !== "all") {
    return {
      colorByScope: "team",
      scopeLabel: "Workspace scope",
    };
  }

  return {
    colorByScope: "workspace",
    scopeLabel: "Organization scope",
  };
}

function OrganizationCalendarFilterControls(props: {
  canSelectTeam: boolean;
  onTeamChange: (value: Id<"teams"> | "all") => void;
  onWorkspaceChange: (value: Id<"workspaces"> | "all") => void;
  selectedTeamId: Id<"teams"> | "all";
  selectedWorkspaceId: Id<"workspaces"> | "all";
  workspaceTeams: TeamSummary[];
  workspaces: WorkspaceSummary[];
}) {
  return (
    <Flex gap="sm" className="w-full sm:w-auto">
      <Select
        value={props.selectedWorkspaceId === "all" ? undefined : props.selectedWorkspaceId}
        onValueChange={(value) => props.onWorkspaceChange(value as Id<"workspaces"> | "all")}
      >
        <SelectTrigger
          aria-label="Workspace filter"
          data-testid={TEST_IDS.ORG_CALENDAR.WORKSPACE_FILTER}
          width="lg"
        >
          <SelectValue placeholder="All workspaces" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All workspaces</SelectItem>
          {props.workspaces.map((workspace) => (
            <SelectItem key={workspace._id} value={workspace._id}>
              {workspace.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        disabled={!props.canSelectTeam}
        value={
          props.canSelectTeam && props.selectedTeamId !== "all" ? props.selectedTeamId : undefined
        }
        onValueChange={(value) => props.onTeamChange(value as Id<"teams"> | "all")}
      >
        <SelectTrigger
          aria-label="Team filter"
          data-testid={TEST_IDS.ORG_CALENDAR.TEAM_FILTER}
          width="lg"
        >
          <SelectValue
            placeholder={
              props.canSelectTeam
                ? props.workspaceTeams.length > 0
                  ? "All teams"
                  : "No teams in workspace"
                : "Select workspace first"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {props.canSelectTeam ? <SelectItem value="all">All teams</SelectItem> : null}
          {props.workspaceTeams.map((team) => (
            <SelectItem key={team._id} value={team._id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Flex>
  );
}

export const Route = createFileRoute("/_auth/_app/$orgSlug/calendar")({
  component: OrganizationCalendarPage,
  validateSearch: (search: Record<string, unknown>): CalendarSearchParams => ({
    workspace: typeof search.workspace === "string" ? search.workspace : undefined,
    team: typeof search.team === "string" ? search.team : undefined,
  }),
});

/** Org-level calendar route with URL-backed workspace/team scoping and reviewed loading states. */
export function OrganizationCalendarPage() {
  const { organizationId } = useOrganization();
  const { workspace: workspaceParam, team: teamParam } = Route.useSearch();
  const navigate = Route.useNavigate();

  const requestedWorkspaceId =
    typeof workspaceParam === "string" ? (workspaceParam as Id<"workspaces">) : undefined;
  const requestedTeamId = typeof teamParam === "string" ? (teamParam as Id<"teams">) : undefined;

  const workspaces = useAuthenticatedQuery(api.workspaces.list, { organizationId });
  const teams = useAuthenticatedQuery(api.teams.getOrganizationTeams, {
    organizationId,
    workspaceId: requestedWorkspaceId,
  });
  const selection = getCalendarSelectionState({
    requestedTeamId,
    requestedWorkspaceId,
    teams,
    workspaces,
  });
  const scopePresentation = getCalendarScopePresentation(selection);

  const setSelectedWorkspaceId = (value: Id<"workspaces"> | "all") => {
    navigate({
      search: {
        workspace: value === "all" ? undefined : value,
        team: undefined,
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

  useEffect(() => {
    if (workspaces === undefined || teams === undefined) {
      return;
    }

    const normalizedWorkspace =
      selection.selectedWorkspaceId === "all" ? undefined : selection.selectedWorkspaceId;
    const normalizedTeam =
      selection.selectedTeamId === "all" ? undefined : selection.selectedTeamId;

    if (workspaceParam === normalizedWorkspace && teamParam === normalizedTeam) {
      return;
    }

    navigate({
      replace: true,
      search: {
        workspace: normalizedWorkspace,
        team: normalizedTeam,
      },
    });
  }, [
    navigate,
    selection.selectedTeamId,
    selection.selectedWorkspaceId,
    teamParam,
    teams,
    workspaceParam,
    workspaces,
  ]);

  if (isE2EOrgCalendarLoadingOverrideEnabled() || workspaces === undefined || teams === undefined) {
    return <OrganizationCalendarLoadingState />;
  }

  return (
    <PageLayout fullHeight>
      <PageHeader
        title={scopePresentation.scopeLabel}
        actions={
          <OrganizationCalendarFilterControls
            canSelectTeam={selection.canSelectTeam}
            onTeamChange={setSelectedTeamId}
            onWorkspaceChange={setSelectedWorkspaceId}
            selectedTeamId={selection.selectedTeamId}
            selectedWorkspaceId={selection.selectedWorkspaceId}
            workspaceTeams={selection.workspaceTeams}
            workspaces={workspaces}
          />
        }
      />
      <div data-testid={TEST_IDS.ORG_CALENDAR.CONTENT}>
        <Suspense fallback={<OrganizationCalendarLoadingBody />}>
          <CalendarView
            organizationId={organizationId}
            workspaceId={
              selection.selectedWorkspaceId === "all" ? undefined : selection.selectedWorkspaceId
            }
            teamId={selection.selectedTeamId === "all" ? undefined : selection.selectedTeamId}
            colorByScope={scopePresentation.colorByScope}
          />
        </Suspense>
      </div>
    </PageLayout>
  );
}
