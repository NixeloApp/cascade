/**
 * Dashboard
 *
 * Main dashboard page showing organization overview.
 * Displays workspaces, recent activity, and quick actions.
 * Provides navigation to projects, issues, and documents.
 */

import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Stack } from "@/components/ui/Stack";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery, useAuthReady } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { useListNavigation } from "../hooks/useListNavigation";
import { FocusZone } from "./Dashboard/FocusZone";
import { Greeting } from "./Dashboard/Greeting";
import { MyIssuesList } from "./Dashboard/MyIssuesList";
import { QuickStats } from "./Dashboard/QuickStats";
import { RecentActivity } from "./Dashboard/RecentActivity";
import { WorkspacesList } from "./Dashboard/WorkspacesList";
import { Typography } from "./ui/Typography";

type IssueFilter = "assigned" | "created" | "all";

/** Main dashboard page with focus task, stats, issues, and activity. */
export function Dashboard() {
  const navigate = useNavigate();
  const { orgSlug } = useOrganization();
  const { canAct } = useAuthReady();
  const [issueFilter, setIssueFilter] = useState<IssueFilter>("assigned");

  // User and Settings
  const user = useAuthenticatedQuery(api.users.getCurrent, {});
  const userSettings = useAuthenticatedQuery(api.userSettings.get, {});
  const layout = userSettings?.dashboardLayout;
  const showStats = layout?.showStats ?? true;
  const showRecentActivity = layout?.showRecentActivity ?? true;
  const showWorkspaces = layout?.showWorkspaces ?? true;
  const sidebarVisible = showRecentActivity || showWorkspaces;

  // Data fetching
  const {
    results: myIssues,
    status: myIssuesStatus,
    loadMore: loadMoreMyIssues,
  } = usePaginatedQuery(api.dashboard.getMyIssues, canAct ? {} : "skip", {
    initialNumItems: 20,
  });

  const myCreatedIssues = useAuthenticatedQuery(api.dashboard.getMyCreatedIssues, {});
  const myProjects = useAuthenticatedQuery(api.dashboard.getMyProjects, {});
  const recentActivity = useAuthenticatedQuery(api.dashboard.getMyRecentActivity, { limit: 10 });
  const stats = useAuthenticatedQuery(api.dashboard.getMyStats, {});
  const focusTask = useAuthenticatedQuery(api.dashboard.getFocusTask, {});

  const displayIssues = getDisplayIssues(issueFilter, myIssues, myCreatedIssues);

  // Navigation helper for keyboard navigation callbacks
  const navigateToWorkspace = (projectKey: string) => {
    navigate({
      to: ROUTES.projects.board.path,
      params: { orgSlug, key: projectKey },
    });
  };

  // Keyboard navigation for issue list
  const issueNavigation = useListNavigation({
    items: displayIssues || [],
    onSelect: (issue) => navigateToWorkspace(issue.projectKey),
    enabled: !!displayIssues && displayIssues.length > 0,
  });

  // Keyboard navigation for projects list
  const projectNavigation = useListNavigation({
    items: myProjects || [],
    onSelect: (project: Doc<"projects">) => navigateToWorkspace(project.key),
    enabled: !!myProjects && myProjects.length > 0,
  });

  return (
    <div className="relative overflow-hidden rounded-container border border-ui-border/40 bg-linear-to-b from-ui-bg to-ui-bg-secondary/50 px-4 py-5 shadow-soft sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-brand-subtle/40 to-transparent" />
      <div className="pointer-events-none absolute -left-16 top-16 h-48 w-48 rounded-full bg-brand-subtle/20 blur-glow" />
      <div className="pointer-events-none absolute right-0 top-24 h-56 w-56 rounded-full bg-accent/10 blur-glow" />

      <div className="relative">
        <Greeting userName={user?.name} completedCount={stats?.completedThisWeek} />

        <Grid cols={1} colsLg={12} gap="lg" className="mb-8">
          <div className="lg:col-span-7">
            <FocusZone task={focusTask} />
          </div>

          <div className="lg:col-span-5">
            {showStats && (
              <Flex direction="column" justify="end" className="h-full">
                <Typography
                  variant="label"
                  color="tertiary"
                  className="mb-3 uppercase tracking-widest"
                >
                  Overview
                </Typography>
                <div className="rounded-2xl border border-ui-border-secondary/70 bg-ui-bg/75 p-3 shadow-soft">
                  <QuickStats stats={stats} />
                </div>
              </Flex>
            )}
          </div>
        </Grid>

        <Grid cols={1} colsLg={12} gap="lg">
          <div className={sidebarVisible ? "lg:col-span-8" : "lg:col-span-12"}>
            <Card
              variant="outline"
              radius="full"
              className="h-full w-full overflow-hidden border-ui-border/50 bg-ui-bg/70 shadow-soft backdrop-blur-sm"
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
            </Card>
          </div>

          {sidebarVisible && (
            <Stack gap="lg" className="lg:col-span-4">
              {showWorkspaces && (
                <WorkspacesList projects={myProjects} projectNavigation={projectNavigation} />
              )}

              {showRecentActivity && <RecentActivity activities={recentActivity} />}
            </Stack>
          )}
        </Grid>
      </div>
    </div>
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
