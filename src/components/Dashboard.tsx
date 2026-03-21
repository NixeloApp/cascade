/**
 * Dashboard
 *
 * Main dashboard page showing organization overview.
 * Displays workspaces, recent activity, and quick actions.
 * Provides navigation to projects, issues, and documents.
 */

import { api } from "@convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Grid, GridItem } from "@/components/ui/Grid";
import { Stack } from "@/components/ui/Stack";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery, useAuthReady } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { useListNavigation } from "../hooks/useListNavigation";
import {
  DashboardPanel,
  DashboardPanelBody,
  DashboardPanelHeader,
} from "./Dashboard/DashboardPanel";
import { FocusZone } from "./Dashboard/FocusZone";
import { Greeting } from "./Dashboard/Greeting";
import { MyIssuesList } from "./Dashboard/MyIssuesList";
import { QuickStats } from "./Dashboard/QuickStats";
import { RecentActivity } from "./Dashboard/RecentActivity";
import { WorkspacesList } from "./Dashboard/WorkspacesList";

type IssueFilter = "assigned" | "created" | "all";
type DashboardIssueListItem = { projectKey: string };
type DashboardProjectListItem = { key: string };

declare global {
  interface Window {
    __NIXELO_E2E_DASHBOARD_LOADING__?: boolean;
  }
}

function isE2EDashboardLoadingOverrideEnabled(): boolean {
  return typeof window !== "undefined" && window.__NIXELO_E2E_DASHBOARD_LOADING__ === true;
}

function DashboardOverview({
  focusTask,
  showStats,
  stats,
}: {
  focusTask: ReturnType<typeof useDashboardData>["focusTask"];
  showStats: boolean;
  stats: ReturnType<typeof useDashboardData>["stats"];
}) {
  return (
    <Grid cols={1} colsLg={12} gap="lg">
      <GridItem colSpanLg={showStats ? 7 : 12}>
        <FocusZone task={focusTask} />
      </GridItem>

      {showStats && (
        <GridItem colSpanLg={5}>
          <DashboardPanel className="h-full">
            <DashboardPanelHeader
              title="Overview"
              description="Weekly capacity, throughput, and pressure stay visible without leaving the command surface."
              badge={
                <Badge variant="neutral" shape="pill">
                  Weekly pulse
                </Badge>
              }
            />
            <DashboardPanelBody>
              <QuickStats stats={stats} />
            </DashboardPanelBody>
          </DashboardPanel>
        </GridItem>
      )}
    </Grid>
  );
}

function DashboardMainContent({
  displayIssues,
  issueFilter,
  issueNavigation,
  loadMoreMyIssues,
  myCreatedIssues,
  myIssues,
  myIssuesStatus,
  myProjects,
  projectNavigation,
  recentActivity,
  setIssueFilter,
  showRecentActivity,
  showWorkspaces,
  sidebarVisible,
}: {
  displayIssues: ReturnType<typeof useDashboardData>["displayIssues"];
  issueFilter: IssueFilter;
  issueNavigation: ReturnType<typeof useListNavigation>;
  loadMoreMyIssues: ReturnType<typeof useDashboardData>["loadMoreMyIssues"];
  myCreatedIssues: ReturnType<typeof useDashboardData>["myCreatedIssues"];
  myIssues: ReturnType<typeof useDashboardData>["myIssues"];
  myIssuesStatus: ReturnType<typeof useDashboardData>["myIssuesStatus"];
  myProjects: ReturnType<typeof useDashboardData>["myProjects"];
  projectNavigation: ReturnType<typeof useListNavigation>;
  recentActivity: ReturnType<typeof useDashboardData>["recentActivity"];
  setIssueFilter: (filter: IssueFilter) => void;
  showRecentActivity: boolean;
  showWorkspaces: boolean;
  sidebarVisible: boolean;
}) {
  return (
    <Grid cols={1} colsLg={12} gap="lg">
      <GridItem colSpanLg={sidebarVisible ? 8 : 12}>
        <MyIssuesList
          myIssues={myIssues}
          myCreatedIssues={myCreatedIssues}
          displayIssues={displayIssues}
          issueFilter={issueFilter}
          onFilterChange={setIssueFilter}
          issueNavigation={issueNavigation}
          loadMore={loadMoreMyIssues}
          status={myIssuesStatus}
        />
      </GridItem>

      {sidebarVisible && (
        <GridItem colSpanLg={4}>
          <Stack gap="lg">
            {showWorkspaces && (
              <WorkspacesList projects={myProjects} projectNavigation={projectNavigation} />
            )}

            {showRecentActivity && <RecentActivity activities={recentActivity} />}
          </Stack>
        </GridItem>
      )}
    </Grid>
  );
}

function useDashboardLayoutSettings() {
  const queriedUser = useAuthenticatedQuery(api.users.getCurrent, {});
  const userSettings = useAuthenticatedQuery(api.userSettings.get, {});
  const layout = userSettings?.dashboardLayout;
  return {
    queriedUser,
    showStats: layout?.showStats ?? true,
    showRecentActivity: layout?.showRecentActivity ?? true,
    showWorkspaces: layout?.showWorkspaces ?? true,
  };
}

function useDashboardQueries() {
  const { canAct } = useAuthReady();
  const paginatedIssues = usePaginatedQuery(api.dashboard.getMyIssues, canAct ? {} : "skip", {
    initialNumItems: 20,
  });
  const queriedMyCreatedIssues = useAuthenticatedQuery(api.dashboard.getMyCreatedIssues, {});
  const queriedMyProjects = useAuthenticatedQuery(api.dashboard.getMyProjects, {});
  const queriedRecentActivity = useAuthenticatedQuery(api.dashboard.getMyRecentActivity, {
    limit: 10,
  });
  const queriedStats = useAuthenticatedQuery(api.dashboard.getMyStats, {});
  const queriedFocusTask = useAuthenticatedQuery(api.dashboard.getFocusTask, {});

  return {
    loadMoreMyIssues: paginatedIssues.loadMore,
    queriedFocusTask,
    queriedMyCreatedIssues,
    queriedMyIssues: paginatedIssues.results,
    queriedMyIssuesStatus: paginatedIssues.status,
    queriedMyProjects,
    queriedRecentActivity,
    queriedStats,
  };
}

function applyDashboardLoadingState<T>(forceLoading: boolean, value: T | undefined) {
  return forceLoading ? undefined : value;
}

function useDashboardNavigation({
  displayIssues,
  forceLoading,
  myProjects,
}: {
  displayIssues: DashboardIssueListItem[] | undefined;
  forceLoading: boolean;
  myProjects: DashboardProjectListItem[] | undefined;
}) {
  const navigate = useNavigate();
  const { orgSlug } = useOrganization();

  const navigateToWorkspace = (projectKey: string) => {
    navigate({
      to: ROUTES.projects.board.path,
      params: { orgSlug, key: projectKey },
    });
  };

  const issueNavigation = useListNavigation({
    items: forceLoading ? [] : displayIssues || [],
    onSelect: (issue) => navigateToWorkspace(issue.projectKey),
    enabled: !forceLoading && !!displayIssues && displayIssues.length > 0,
  });

  const projectNavigation = useListNavigation({
    items: forceLoading ? [] : myProjects || [],
    onSelect: (project) => navigateToWorkspace(project.key),
    enabled: !forceLoading && !!myProjects && myProjects.length > 0,
  });

  return { issueNavigation, projectNavigation };
}

function useDashboardData(issueFilter: IssueFilter) {
  const forceLoading = isE2EDashboardLoadingOverrideEnabled();
  const { queriedUser, showStats, showRecentActivity, showWorkspaces } =
    useDashboardLayoutSettings();
  const {
    loadMoreMyIssues,
    queriedFocusTask,
    queriedMyCreatedIssues,
    queriedMyIssues,
    queriedMyIssuesStatus,
    queriedMyProjects,
    queriedRecentActivity,
    queriedStats,
  } = useDashboardQueries();

  const user = forceLoading ? undefined : queriedUser;
  const myIssues = applyDashboardLoadingState(forceLoading, queriedMyIssues);
  const myIssuesStatus = forceLoading ? "LoadingFirstPage" : queriedMyIssuesStatus;
  const myCreatedIssues = applyDashboardLoadingState(forceLoading, queriedMyCreatedIssues);
  const myProjects = applyDashboardLoadingState(forceLoading, queriedMyProjects);
  const recentActivity = applyDashboardLoadingState(forceLoading, queriedRecentActivity);
  const stats = applyDashboardLoadingState(forceLoading, queriedStats);
  const focusTask = applyDashboardLoadingState(forceLoading, queriedFocusTask);
  const displayIssues = forceLoading
    ? undefined
    : getDisplayIssues(issueFilter, myIssues, myCreatedIssues);
  const { issueNavigation, projectNavigation } = useDashboardNavigation({
    displayIssues,
    forceLoading,
    myProjects,
  });
  const sidebarVisible = showRecentActivity || showWorkspaces;

  return {
    displayIssues,
    focusTask,
    issueNavigation,
    loadMoreMyIssues,
    myCreatedIssues,
    myIssues,
    myIssuesStatus,
    myProjects,
    projectNavigation,
    recentActivity,
    showRecentActivity,
    showStats,
    showWorkspaces,
    sidebarVisible,
    stats,
    user,
  };
}

/** Main dashboard page with focus task, stats, issues, and activity. */
export function Dashboard() {
  const [issueFilter, setIssueFilter] = useState<IssueFilter>("assigned");
  const {
    displayIssues,
    focusTask,
    issueNavigation,
    loadMoreMyIssues,
    myCreatedIssues,
    myIssues,
    myIssuesStatus,
    myProjects,
    projectNavigation,
    recentActivity,
    showRecentActivity,
    showStats,
    showWorkspaces,
    sidebarVisible,
    stats,
    user,
  } = useDashboardData(issueFilter);

  return (
    <Card recipe="dashboardShell" padding="lg" className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-brand-subtle/40 to-transparent" />
      <div className="pointer-events-none absolute -left-16 top-16 h-48 w-48 rounded-full bg-brand-subtle/20 blur-glow" />
      <div className="pointer-events-none absolute right-0 top-24 h-56 w-56 rounded-full bg-accent/10 blur-glow" />

      <div className="relative">
        <Stack gap="2xl">
          <Greeting userName={user?.name} completedCount={stats?.completedThisWeek} />

          <DashboardOverview focusTask={focusTask} showStats={showStats} stats={stats} />
          <DashboardMainContent
            displayIssues={displayIssues}
            issueFilter={issueFilter}
            issueNavigation={issueNavigation}
            loadMoreMyIssues={loadMoreMyIssues}
            myCreatedIssues={myCreatedIssues}
            myIssues={myIssues}
            myIssuesStatus={myIssuesStatus}
            myProjects={myProjects}
            projectNavigation={projectNavigation}
            recentActivity={recentActivity}
            setIssueFilter={setIssueFilter}
            showRecentActivity={showRecentActivity}
            showWorkspaces={showWorkspaces}
            sidebarVisible={sidebarVisible}
          />
        </Stack>
      </div>
    </Card>
  );
}

function getDisplayIssues<T>(
  filter: IssueFilter,
  assigned: T[] | undefined,
  created: T[] | undefined,
): T[] | undefined {
  if (filter === "assigned") return assigned;
  if (filter === "created") return created;
  return [...(assigned || []), ...(created || [])];
}
