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
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid, GridItem } from "@/components/ui/Grid";
import { Stack } from "@/components/ui/Stack";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery, useAuthReady } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { cn } from "@/lib/utils";
import { useListNavigation } from "../hooks/useListNavigation";
import { FocusZone } from "./Dashboard/FocusZone";
import { Greeting } from "./Dashboard/Greeting";
import { MyIssuesList } from "./Dashboard/MyIssuesList";
import { QuickStats } from "./Dashboard/QuickStats";
import { RecentActivity } from "./Dashboard/RecentActivity";
import { WorkspacesList } from "./Dashboard/WorkspacesList";
import { Typography } from "./ui/Typography";

type IssueFilter = "assigned" | "created" | "all";

declare global {
  interface Window {
    __NIXELO_E2E_DASHBOARD_LOADING__?: boolean;
  }
}

function isE2EDashboardLoadingOverrideEnabled(): boolean {
  return typeof window !== "undefined" && window.__NIXELO_E2E_DASHBOARD_LOADING__ === true;
}

/** Main dashboard page with focus task, stats, issues, and activity. */
export function Dashboard() {
  const navigate = useNavigate();
  const { orgSlug } = useOrganization();
  const { canAct } = useAuthReady();
  const [issueFilter, setIssueFilter] = useState<IssueFilter>("assigned");
  const forceLoading = isE2EDashboardLoadingOverrideEnabled();

  // User and Settings
  const queriedUser = useAuthenticatedQuery(api.users.getCurrent, {});
  const userSettings = useAuthenticatedQuery(api.userSettings.get, {});
  const layout = userSettings?.dashboardLayout;
  const showStats = layout?.showStats ?? true;
  const showRecentActivity = layout?.showRecentActivity ?? true;
  const showWorkspaces = layout?.showWorkspaces ?? true;
  const sidebarVisible = showRecentActivity || showWorkspaces;

  // Data fetching
  const {
    results: queriedMyIssues,
    status: queriedMyIssuesStatus,
    loadMore: loadMoreMyIssues,
  } = usePaginatedQuery(api.dashboard.getMyIssues, canAct ? {} : "skip", {
    initialNumItems: 20,
  });

  const queriedMyCreatedIssues = useAuthenticatedQuery(api.dashboard.getMyCreatedIssues, {});
  const queriedMyProjects = useAuthenticatedQuery(api.dashboard.getMyProjects, {});
  const queriedRecentActivity = useAuthenticatedQuery(api.dashboard.getMyRecentActivity, {
    limit: 10,
  });
  const queriedStats = useAuthenticatedQuery(api.dashboard.getMyStats, {});
  const queriedFocusTask = useAuthenticatedQuery(api.dashboard.getFocusTask, {});

  const user = forceLoading ? undefined : queriedUser;
  const myIssues = forceLoading ? undefined : queriedMyIssues;
  const myIssuesStatus = forceLoading ? "LoadingFirstPage" : queriedMyIssuesStatus;
  const myCreatedIssues = forceLoading ? undefined : queriedMyCreatedIssues;
  const myProjects = forceLoading ? undefined : queriedMyProjects;
  const recentActivity = forceLoading ? undefined : queriedRecentActivity;
  const stats = forceLoading ? undefined : queriedStats;
  const focusTask = forceLoading ? undefined : queriedFocusTask;

  const displayIssues = forceLoading
    ? undefined
    : getDisplayIssues(issueFilter, myIssues, myCreatedIssues);

  // Navigation helper for keyboard navigation callbacks
  const navigateToWorkspace = (projectKey: string) => {
    navigate({
      to: ROUTES.projects.board.path,
      params: { orgSlug, key: projectKey },
    });
  };

  // Keyboard navigation for issue list
  const issueNavigation = useListNavigation({
    items: forceLoading ? [] : displayIssues || [],
    onSelect: (issue) => navigateToWorkspace(issue.projectKey),
    enabled: !forceLoading && !!displayIssues && displayIssues.length > 0,
  });

  // Keyboard navigation for projects list
  const projectNavigation = useListNavigation({
    items: forceLoading ? [] : myProjects || [],
    onSelect: (project) => navigateToWorkspace(project.key),
    enabled: !forceLoading && !!myProjects && myProjects.length > 0,
  });

  return (
    <Card recipe="dashboardShell" padding="lg" className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-brand-subtle/40 to-transparent" />
      <div className="pointer-events-none absolute -left-16 top-16 h-48 w-48 rounded-full bg-brand-subtle/20 blur-glow" />
      <div className="pointer-events-none absolute right-0 top-24 h-56 w-56 rounded-full bg-accent/10 blur-glow" />

      <div className="relative">
        <Stack gap="2xl">
          <Greeting userName={user?.name} completedCount={stats?.completedThisWeek} />

          <Grid cols={1} colsLg={12} gap="lg">
            <GridItem colSpanLg={showStats ? 7 : 12}>
              <FocusZone task={focusTask} />
            </GridItem>

            {showStats && (
              <GridItem colSpanLg={5}>
                <Flex direction="column" justify="end" gap="sm">
                  <Typography variant="eyebrow" color="tertiary">
                    Overview
                  </Typography>
                  <div className={getCardRecipeClassName("dashboardPanel")}>
                    <QuickStats stats={stats} />
                  </div>
                </Flex>
              </GridItem>
            )}
          </Grid>

          <Grid cols={1} colsLg={12} gap="lg">
            <GridItem colSpanLg={sidebarVisible ? 8 : 12}>
              <div
                className={cn(
                  getCardRecipeClassName("dashboardPanelInset"),
                  "h-full w-full rounded-2xl",
                )}
              >
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
              </div>
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
