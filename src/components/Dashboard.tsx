import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { useListNavigation } from "../hooks/useListNavigation";
import { DashboardCustomizeModal } from "./Dashboard/DashboardCustomizeModal";
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
    <div className="min-h-screen bg-ui-bg-secondary relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-linear-to-b from-brand-600/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <Flex justify="between" align="start" className="mb-8">
          <Greeting userName={user?.name} completedCount={stats?.completedThisWeek} />
          <div className="mt-2">
            <DashboardCustomizeModal />
          </div>
        </Flex>

        {/* Top Actionable Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Focus Zone - Span 5 */}
          <div className="lg:col-span-5">
            <FocusZone task={focusTask} />
          </div>

          {/* Quick Stats - Span 7 */}
          <div className="lg:col-span-7">
            {showStats && (
              <div className="h-full flex flex-col justify-end">
                <Typography
                  variant="small"
                  color="tertiary"
                  className="uppercase tracking-widest mb-2 font-bold"
                >
                  Overview
                </Typography>
                <QuickStats stats={stats} />
              </div>
            )}
          </div>
        </div>

        {/* Main Workspace Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed/Issues */}
          <Flex className={sidebarVisible ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="bg-ui-bg-primary/40 backdrop-blur-md rounded-xl border border-ui-border-primary/50 overflow-hidden shadow-sm">
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
          </Flex>

          {/* Sidebars */}
          {sidebarVisible && (
            <div className="space-y-8">
              {/* My Workspaces */}
              {showWorkspaces && (
                <WorkspacesList projects={myProjects} projectNavigation={projectNavigation} />
              )}

              {/* Recent Activity */}
              {showRecentActivity && <RecentActivity activities={recentActivity} />}
            </div>
          )}
        </div>
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
