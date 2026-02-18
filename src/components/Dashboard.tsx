import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Stack } from "@/components/ui/Stack";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { useListNavigation } from "../hooks/useListNavigation";
import { FocusZone } from "./Dashboard/FocusZone";
import { Greeting } from "./Dashboard/Greeting";
import { MyIssuesList } from "./Dashboard/MyIssuesList";
import { WorkspacesList } from "./Dashboard/ProjectsList";
import { QuickStats } from "./Dashboard/QuickStats";
import { RecentActivity } from "./Dashboard/RecentActivity";
import { Typography } from "./ui/Typography";

type IssueFilter = "assigned" | "created" | "all";

export function Dashboard() {
  const navigate = useNavigate();
  const { orgSlug } = useOrganization();
  const [issueFilter, setIssueFilter] = useState<IssueFilter>("assigned");

  // User and Settings
  const user = useQuery(api.users.getCurrent);
  const userSettings = useQuery(api.userSettings.get);
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
  } = usePaginatedQuery(api.dashboard.getMyIssues, {}, { initialNumItems: 20 });

  const myCreatedIssues = useQuery(api.dashboard.getMyCreatedIssues);
  const myProjects = useQuery(api.dashboard.getMyProjects);
  const recentActivity = useQuery(api.dashboard.getMyRecentActivity, { limit: 10 });
  const stats = useQuery(api.dashboard.getMyStats);
  const focusTask = useQuery(api.dashboard.getFocusTask);

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
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <Greeting userName={user?.name} completedCount={stats?.completedThisWeek} />
      </div>

      {/* Top Actionable Grid */}
      <Grid cols={1} colsLg={12} gap="xl" className="mb-8">
        {/* Focus Zone - Span 5 */}
        <div className="lg:col-span-5">
          <FocusZone task={focusTask} />
        </div>

        {/* Quick Stats - Span 7 */}
        <div className="lg:col-span-7">
          {showStats && (
            <Flex direction="column" justify="end" className="h-full">
              <Typography
                variant="small"
                color="tertiary"
                className="uppercase tracking-widest mb-2 font-bold"
              >
                Overview
              </Typography>
              <QuickStats stats={stats} />
            </Flex>
          )}
        </div>
      </Grid>

      {/* Main Workspace Content */}
      <Grid cols={1} colsLg={3} gap="xl">
        {/* Main Feed/Issues */}
        <Flex className={sidebarVisible ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card variant="flat" radius="full" className="overflow-hidden">
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
        </Flex>

        {/* Sidebars */}
        {sidebarVisible && (
          <Stack gap="xl">
            {/* My Workspaces */}
            {showWorkspaces && (
              <WorkspacesList projects={myProjects} projectNavigation={projectNavigation} />
            )}

            {/* Recent Activity */}
            {showRecentActivity && <RecentActivity activities={recentActivity} />}
          </Stack>
        )}
      </Grid>
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
