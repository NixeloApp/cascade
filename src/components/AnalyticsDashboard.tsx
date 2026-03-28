import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AnalyticsInsightCard } from "@/components/Analytics/AnalyticsInsightCard";
import { BarChart } from "@/components/Analytics/BarChart";
import { ChartCard } from "@/components/Analytics/ChartCard";
import { MetricCard } from "@/components/Analytics/MetricCard";
import { RecentActivity } from "@/components/Analytics/RecentActivity";
import { PageHeader, PageLayout, PageStack } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { Grid } from "@/components/ui/Grid";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatDate } from "@/lib/formatting";
import { CheckCircle, FolderKanban, MapPin, TrendingUp, Users, Zap } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { Skeleton, SkeletonStatCard } from "./ui/Skeleton";

interface Props {
  projectId: Id<"projects">;
  projectName: string;
  projectKey: string;
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

type BreakdownEntry = {
  label: string;
  value: number;
};

function buildBreakdownEntries(
  breakdown: Record<string, number>,
  labelMap?: Record<string, string>,
) {
  return Object.entries(breakdown).map(([label, value]) => ({
    label: labelMap?.[label] ?? label,
    value,
  }));
}

function getTopBreakdownEntry(entries: BreakdownEntry[]) {
  return entries.reduce<BreakdownEntry | null>((topEntry, currentEntry) => {
    if (!topEntry || currentEntry.value > topEntry.value) {
      return currentEntry;
    }

    return topEntry;
  }, null);
}

function getLatestActivityTimestamp(
  activities: { _creationTime: number }[] | undefined,
): number | undefined {
  return activities?.[0]?._creationTime;
}

function formatPercentage(value: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function formatSnapshotValue(value: number, noun: string) {
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}

function formatSprintSummary(velocity: VelocityData) {
  if (velocity.velocityData.length === 0) {
    return {
      value: "No sprint history",
      description: "Velocity will settle in once this project completes its first sprint.",
      meta: ["No completed sprints yet"],
    };
  }

  const latestSprint = velocity.velocityData[velocity.velocityData.length - 1];

  return {
    value: `${velocity.averageVelocity} pts/sprint`,
    description: `Average throughput across ${formatSnapshotValue(velocity.velocityData.length, "completed sprint")}.`,
    meta: latestSprint
      ? [
          `${latestSprint.sprintName}: ${latestSprint.points} pts`,
          `${latestSprint.issuesCompleted} completed`,
        ]
      : undefined,
  };
}

function AnalyticsChartSkeletonCard() {
  return (
    <Card variant="elevated" padding="lg">
      <Stack gap="md">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full" />
      </Stack>
    </Card>
  );
}

/** Project analytics dashboard with shared shell discipline and explicit empty states. */
export function AnalyticsDashboard({ projectId, projectName, projectKey }: Props) {
  const analytics = useAuthenticatedQuery(api.analytics.getProjectAnalytics, { projectId }) as
    | AnalyticsData
    | undefined;
  const velocity = useAuthenticatedQuery(api.analytics.getTeamVelocity, { projectId }) as
    | VelocityData
    | undefined;
  const recentActivity = useAuthenticatedQuery(api.analytics.getRecentActivity, {
    projectId,
    limit: 10,
  });
  const timeMetrics = useAuthenticatedQuery(api.analytics.getTimeMetrics, { projectId });

  if (!(analytics && velocity)) {
    return (
      <PageLayout maxWidth="xl">
        <PageStack>
          <Stack gap="xs">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-96" />
          </Stack>
          <Grid cols={1} colsMd={3} gap="md">
            <Card variant="elevated" padding="lg">
              <Skeleton className="h-5 w-20 mb-4" />
              <Skeleton className="h-7 w-28 mb-3" />
              <Skeleton className="h-4 w-full" />
            </Card>
            <Card variant="elevated" padding="lg">
              <Skeleton className="h-5 w-20 mb-4" />
              <Skeleton className="h-7 w-32 mb-3" />
              <Skeleton className="h-4 w-full" />
            </Card>
            <Card variant="elevated" padding="lg">
              <Skeleton className="h-5 w-20 mb-4" />
              <Skeleton className="h-7 w-24 mb-3" />
              <Skeleton className="h-4 w-full" />
            </Card>
          </Grid>
          <Grid cols={2} colsMd={4} gap="md">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </Grid>
          <Grid cols={1} colsLg={2} gap="lg">
            <AnalyticsChartSkeletonCard />
            <AnalyticsChartSkeletonCard />
          </Grid>
        </PageStack>
      </PageLayout>
    );
  }

  const statusChartData = buildBreakdownEntries(analytics.issuesByStatus);
  const typeChartData = buildBreakdownEntries(analytics.issuesByType, {
    task: "Task",
    bug: "Bug",
    story: "Story",
    epic: "Epic",
  });
  const priorityChartData = buildBreakdownEntries(analytics.issuesByPriority, {
    highest: "Highest",
    high: "High",
    medium: "Medium",
    low: "Low",
    lowest: "Lowest",
  });
  const velocityChartData = velocity.velocityData.map((entry) => ({
    label: entry.sprintName,
    value: entry.points,
  }));
  const assigneeChartData = Object.values(analytics.issuesByAssignee).map((assignee) => ({
    label: assignee.name,
    value: assignee.count,
  }));

  const completedIssues = analytics.issuesByStatus.done ?? 0;
  const openIssues = Math.max(analytics.totalIssues - completedIssues, 0);
  const assignedIssues = Math.max(analytics.totalIssues - analytics.unassignedCount, 0);
  const activeContributors = assigneeChartData.filter((entry) => entry.value > 0).length;
  const topStatus = getTopBreakdownEntry(statusChartData);
  const topType = getTopBreakdownEntry(typeChartData);
  const topAssignee = getTopBreakdownEntry(assigneeChartData);
  const latestActivity = getLatestActivityTimestamp(recentActivity);
  const sprintSummary = formatSprintSummary(velocity);

  return (
    <PageLayout maxWidth="xl">
      <PageStack>
        <div data-testid={TEST_IDS.ANALYTICS.PAGE_HEADER}>
          <PageHeader
            title={`${projectName} analytics`}
            description={`Delivery, workload, and ownership signals for ${projectKey}.`}
            descriptionTestId={TEST_IDS.ANALYTICS.PAGE_DESCRIPTION}
            spacing="stack"
          />
        </div>

        <Grid cols={1} colsMd={3} gap="md">
          <AnalyticsInsightCard
            title="Flow Snapshot"
            value={formatSnapshotValue(openIssues, "open issue")}
            description={
              topStatus
                ? `${topStatus.label} is the biggest queue right now.`
                : "Issue flow will appear here once work lands in the project."
            }
            icon={FolderKanban}
            meta={[
              `${completedIssues} done`,
              topType ? `Top work type: ${topType.label}` : "No typed issue mix yet",
            ]}
          />
          <AnalyticsInsightCard
            title="Ownership"
            value={`${formatPercentage(assignedIssues, analytics.totalIssues)} assigned`}
            description={
              activeContributors > 0
                ? `${formatSnapshotValue(activeContributors, "active contributor")} currently own work in this project.`
                : "No active assignees yet."
            }
            icon={Users}
            meta={[
              `${analytics.unassignedCount} unassigned`,
              topAssignee ? `Top owner: ${topAssignee.label}` : "No ownership leader yet",
            ]}
          />
          <AnalyticsInsightCard
            title="Sprint Signal"
            value={sprintSummary.value}
            description={sprintSummary.description}
            icon={Zap}
            meta={sprintSummary.meta}
          />
        </Grid>

        <Grid cols={2} colsMd={4} gap="md">
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
          {timeMetrics && timeMetrics.cycleTimeMedianDays !== null && (
            <MetricCard
              title="Cycle Time"
              value={timeMetrics.cycleTimeMedianDays}
              subtitle="days (median)"
              icon={TrendingUp}
            />
          )}
          {timeMetrics && timeMetrics.leadTimeMedianDays !== null && (
            <MetricCard
              title="Lead Time"
              value={timeMetrics.leadTimeMedianDays}
              subtitle="days (median)"
              icon={TrendingUp}
            />
          )}
        </Grid>

        <Grid cols={1} colsLg={2} gap="lg">
          <ChartCard
            title="Issues by Status"
            description="Where work is currently pooling across the workflow."
            testId={TEST_IDS.ANALYTICS.CHART_STATUS}
            emptyState={
              statusChartData.length === 0
                ? {
                    title: "No workflow data yet",
                    description:
                      "Status distribution will appear once issues move through the board.",
                  }
                : undefined
            }
          >
            <BarChart data={statusChartData} color="bg-status-info" />
          </ChartCard>

          <ChartCard
            title="Issues by Type"
            description="The current mix of tasks, bugs, stories, and epics."
            testId={TEST_IDS.ANALYTICS.CHART_TYPE}
            emptyState={
              typeChartData.length === 0
                ? {
                    title: "No work-type data yet",
                    description:
                      "Issue type breakdown will appear once this project has issue volume.",
                  }
                : undefined
            }
          >
            <BarChart data={typeChartData} color="bg-status-success" />
          </ChartCard>

          <ChartCard
            title="Issues by Priority"
            description="Whether urgency is clustering in one part of the backlog."
            testId={TEST_IDS.ANALYTICS.CHART_PRIORITY}
            emptyState={
              priorityChartData.length === 0
                ? {
                    title: "No priority data yet",
                    description: "Priority distribution will appear as work gets triaged.",
                  }
                : undefined
            }
          >
            <BarChart data={priorityChartData} color="bg-status-warning" />
          </ChartCard>

          <ChartCard
            title="Team Velocity"
            description="Completed sprint throughput over the last 10 sprints."
            testId={TEST_IDS.ANALYTICS.CHART_VELOCITY}
            emptyState={
              velocityChartData.length === 0
                ? {
                    title: "No sprint history yet",
                    description: "Finish a sprint to start building a usable velocity trend.",
                  }
                : undefined
            }
          >
            <BarChart data={velocityChartData} color="bg-accent" />
          </ChartCard>
        </Grid>

        <ChartCard
          title="Issues by Assignee"
          description="How currently assigned work is distributed across the team."
          testId={TEST_IDS.ANALYTICS.CHART_ASSIGNEE}
          emptyState={
            assigneeChartData.length === 0
              ? {
                  title: "No assigned work yet",
                  description: "Assign issues to teammates to see ownership distribution here.",
                }
              : undefined
          }
        >
          <BarChart data={assigneeChartData} color="bg-brand" />
        </ChartCard>

        <RecentActivity activities={recentActivity} />

        <Typography variant="small" color="tertiary">
          {latestActivity
            ? `Latest visible activity recorded ${formatDate(latestActivity)}.`
            : "No activity has been recorded for this project yet."}
        </Typography>
      </PageStack>
    </PageLayout>
  );
}
