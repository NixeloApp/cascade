import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import { PageHeader, PageLayout } from "@/components/layout";
import { Flex } from "@/components/ui/Flex";
import { CheckCircle, MapPin, TrendingUp, Zap } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { BarChart } from "./Analytics/BarChart";
import { ChartCard } from "./Analytics/ChartCard";
import { MetricCard } from "./Analytics/MetricCard";
import { RecentActivity } from "./Analytics/RecentActivity";
import { Skeleton, SkeletonStatCard } from "./ui/Skeleton";
import { Typography } from "./ui/Typography";

interface Props {
  projectId: Id<"projects">;
}

interface AnalyticsData {
  totalIssues: number;
  issuesByStatus: Record<string, number>;
  issuesByType: Record<string, number>;
  issuesByPriority: Record<string, number>;
  issuesByAssignee: Record<string, { count: number; name: string }>;
  unassignedCount: number;
}

interface VelocityData {
  velocityData: {
    sprintName: string;
    sprintId: Id<"sprints">;
    points: number;
    issuesCompleted: number;
  }[];
  averageVelocity: number;
}

export function AnalyticsDashboard({ projectId }: Props) {
  const analytics = useQuery(api.analytics.getProjectAnalytics, { projectId }) as
    | AnalyticsData
    | undefined;
  const velocity = useQuery(api.analytics.getTeamVelocity, { projectId }) as
    | VelocityData
    | undefined;
  const recentActivity = useQuery(api.analytics.getRecentActivity, {
    projectId,
    limit: 10,
  });

  // Memoize chart data to avoid recalculation on every render
  const statusChartData = useMemo(
    () =>
      analytics
        ? Object.entries(analytics.issuesByStatus).map(([status, count]) => ({
            label: status,
            value: count,
          }))
        : [],
    [analytics],
  );

  const typeChartData = useMemo(
    () =>
      analytics
        ? [
            { label: "Task", value: analytics.issuesByType.task },
            { label: "Bug", value: analytics.issuesByType.bug },
            { label: "Story", value: analytics.issuesByType.story },
            { label: "Epic", value: analytics.issuesByType.epic },
          ]
        : [],
    [analytics],
  );

  const priorityChartData = useMemo(
    () =>
      analytics
        ? [
            { label: "Highest", value: analytics.issuesByPriority.highest },
            { label: "High", value: analytics.issuesByPriority.high },
            { label: "Medium", value: analytics.issuesByPriority.medium },
            { label: "Low", value: analytics.issuesByPriority.low },
            { label: "Lowest", value: analytics.issuesByPriority.lowest },
          ]
        : [],
    [analytics],
  );

  const velocityChartData = useMemo(
    () =>
      velocity
        ? velocity.velocityData.map((v) => ({
            label: v.sprintName,
            value: v.points,
          }))
        : [],
    [velocity],
  );

  const assigneeChartData = useMemo(
    () =>
      analytics
        ? Object.values(analytics.issuesByAssignee).map((a) => ({
            label: a.name,
            value: a.count,
          }))
        : [],
    [analytics],
  );

  if (!(analytics && velocity)) {
    return (
      <PageLayout fullHeight className="bg-ui-bg-secondary">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header Skeleton */}
          <div>
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-64 mb-2" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </div>

          {/* Metric Cards Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-ui-bg rounded-lg shadow p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-4" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
            <div className="bg-ui-bg rounded-lg shadow p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-4" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
            <div className="bg-ui-bg rounded-lg shadow p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-4" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
            <div className="bg-ui-bg rounded-lg shadow p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-4" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullHeight className="bg-ui-bg-secondary">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <PageHeader
          title="Analytics Dashboard"
          description="Project insights, team velocity, and progress metrics"
          className="mb-0"
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            title="Total Issues"
            value={analytics.totalIssues}
            icon={TrendingUp}
            testId={TEST_IDS.ANALYTICS.METRIC_TOTAL_ISSUES}
          />
          <MetricCard
            title="Unassigned"
            value={analytics.unassignedCount}
            icon={MapPin}
            highlight={analytics.unassignedCount > 0}
            testId={TEST_IDS.ANALYTICS.METRIC_UNASSIGNED}
          />
          <MetricCard
            title="Avg Velocity"
            value={velocity.averageVelocity}
            subtitle="points/sprint"
            icon={Zap}
            testId={TEST_IDS.ANALYTICS.METRIC_AVG_VELOCITY}
          />
          <MetricCard
            title="Completed Sprints"
            value={velocity.velocityData.length}
            icon={CheckCircle}
            testId={TEST_IDS.ANALYTICS.METRIC_COMPLETED_SPRINTS}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Issues by Status */}
          <ChartCard title="Issues by Status">
            <BarChart data={statusChartData} color="bg-status-info" />
          </ChartCard>

          {/* Issues by Type */}
          <ChartCard title="Issues by Type">
            <BarChart data={typeChartData} color="bg-status-success" />
          </ChartCard>

          {/* Issues by Priority */}
          <ChartCard title="Issues by Priority">
            <BarChart data={priorityChartData} color="bg-status-warning" />
          </ChartCard>

          {/* Team Velocity */}
          <ChartCard title="Team Velocity (Last 10 Sprints)">
            {velocityChartData.length > 0 ? (
              <BarChart data={velocityChartData} color="bg-accent" />
            ) : (
              <Flex align="center" justify="center" className="h-full text-ui-text-secondary">
                <Typography variant="p">No completed sprints yet</Typography>
              </Flex>
            )}
          </ChartCard>
        </div>

        {/* Issues by Assignee */}
        {assigneeChartData.length > 0 && (
          <ChartCard title="Issues by Assignee">
            <BarChart data={assigneeChartData} color="bg-brand" />
          </ChartCard>
        )}

        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} />
      </div>
    </PageLayout>
  );
}
