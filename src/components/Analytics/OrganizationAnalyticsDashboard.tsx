import { ChartCard } from "@/components/Analytics/ChartCard";
import { MetricCard } from "@/components/Analytics/MetricCard";
import { PageHeader, PageLayout, PageStack } from "@/components/layout";
import { CardSection } from "@/components/ui/CardSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { CheckCircle, FolderKanban, TrendingUp, Users } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { AnalyticsSection } from "./AnalyticsSection";
import { BarChart } from "./BarChart";

interface BreakdownCountMap {
  task: number;
  bug: number;
  story: number;
  epic: number;
  subtask: number;
}

interface PriorityCountMap {
  highest: number;
  high: number;
  medium: number;
  low: number;
  lowest: number;
}

interface ProjectBreakdownItem {
  projectId: string;
  name: string;
  key: string;
  issueCount: number;
}

export interface OrganizationAnalyticsData {
  totalIssues: number;
  completedCount: number;
  unassignedCount: number;
  projectCount: number;
  issuesByType: BreakdownCountMap;
  issuesByPriority: PriorityCountMap;
  projectBreakdown: ProjectBreakdownItem[];
  isProjectsTruncated: boolean;
}

interface TrendData {
  currentPeriod: { created: number; completed: number };
  previousPeriod: { created: number; completed: number };
  createdChange: number;
  completedChange: number;
}

interface OrganizationAnalyticsDashboardProps {
  analytics: OrganizationAnalyticsData;
  trend?: TrendData;
  headerActions?: React.ReactNode;
}

function getOrgAnalyticsEmptyStateCopy(analytics: OrganizationAnalyticsData): {
  title: string;
  description: string;
} {
  if (analytics.projectCount === 0) {
    return {
      title: "No projects available",
      description: "Join or create a project to populate organization-level analytics.",
    };
  }

  return {
    title: "No issue activity for this period",
    description:
      "Try a broader time range or create work in one of your projects to populate these charts.",
  };
}

function ProjectBreakdownSection({
  projectBreakdown,
  emptyState,
}: {
  projectBreakdown: ProjectBreakdownItem[];
  emptyState?: {
    title: string;
    description: string;
  };
}) {
  return (
    <AnalyticsSection
      title="Project Breakdown"
      description={`Issue counts across ${projectBreakdown.length} active project${projectBreakdown.length === 1 ? "" : "s"}.`}
      data-testid={TEST_IDS.ANALYTICS.ORG_PROJECT_BREAKDOWN}
    >
      {projectBreakdown.length === 0 && emptyState ? (
        <EmptyState
          data-testid={TEST_IDS.ANALYTICS.ORG_PROJECT_BREAKDOWN_EMPTY}
          icon={FolderKanban}
          title={emptyState.title}
          description={emptyState.description}
          size="compact"
          surface="bare"
        />
      ) : (
        <Stack gap="sm">
          {projectBreakdown.map((project) => (
            <CardSection key={project.projectId} size="compact">
              <Flex align="center" justify="between" gap="md">
                <FlexItem flex="1">
                  <Stack gap="none">
                    <Typography variant="label">{project.name}</Typography>
                    <Typography variant="caption" color="tertiary">
                      {project.key}
                    </Typography>
                  </Stack>
                </FlexItem>
                <Typography variant="h4">{project.issueCount}</Typography>
              </Flex>
            </CardSection>
          ))}
        </Stack>
      )}
    </AnalyticsSection>
  );
}

/** Organization-wide analytics dashboard aligned to the shared analytics shell. */
function TrendSection({ trend }: { trend: TrendData }) {
  const formatChange = (change: number) => {
    if (change > 0) return `+${change}%`;
    if (change < 0) return `${change}%`;
    return "0%";
  };

  return (
    <AnalyticsSection title="Period Comparison" description="Current period vs previous period.">
      <Grid cols={2} colsMd={4} gap="lg">
        <MetricCard
          title="Created (current)"
          value={trend.currentPeriod.created}
          icon={TrendingUp}
          testId="trend-created-current"
        />
        <MetricCard
          title="Created (previous)"
          value={trend.previousPeriod.created}
          subtitle={formatChange(trend.createdChange)}
          icon={TrendingUp}
          testId="trend-created-previous"
        />
        <MetricCard
          title="Completed (current)"
          value={trend.currentPeriod.completed}
          icon={CheckCircle}
          testId="trend-completed-current"
        />
        <MetricCard
          title="Completed (previous)"
          value={trend.previousPeriod.completed}
          subtitle={formatChange(trend.completedChange)}
          icon={CheckCircle}
          testId="trend-completed-previous"
        />
      </Grid>
    </AnalyticsSection>
  );
}

/** Organization-wide analytics dashboard with metrics, charts, trends, and project breakdown. */
export function OrganizationAnalyticsDashboard({
  analytics,
  trend,
  headerActions,
}: OrganizationAnalyticsDashboardProps) {
  const typeChartData = [
    { label: "Task", value: analytics.issuesByType.task },
    { label: "Bug", value: analytics.issuesByType.bug },
    { label: "Story", value: analytics.issuesByType.story },
    { label: "Epic", value: analytics.issuesByType.epic },
    { label: "Subtask", value: analytics.issuesByType.subtask },
  ];

  const priorityChartData = [
    { label: "Highest", value: analytics.issuesByPriority.highest },
    { label: "High", value: analytics.issuesByPriority.high },
    { label: "Medium", value: analytics.issuesByPriority.medium },
    { label: "Low", value: analytics.issuesByPriority.low },
    { label: "Lowest", value: analytics.issuesByPriority.lowest },
  ];

  const projectChartData = analytics.projectBreakdown.slice(0, 10).map((project) => ({
    label: project.key,
    value: project.issueCount,
  }));
  const emptyStateCopy = getOrgAnalyticsEmptyStateCopy(analytics);
  const hasAnyIssues = analytics.totalIssues > 0;

  return (
    <PageLayout maxWidth="xl" data-testid={TEST_IDS.ANALYTICS.ORG_PAGE}>
      <PageStack>
        <div data-testid={TEST_IDS.ANALYTICS.PAGE_HEADER}>
          <PageHeader
            title="Analytics"
            description="Organization-wide issue metrics and project health."
            spacing="stack"
            actions={headerActions}
          />
        </div>

        {analytics.isProjectsTruncated ? (
          <CardSection
            data-testid={TEST_IDS.ANALYTICS.ORG_TRUNCATION_NOTICE}
            size="compact"
            className="border-status-warning/20 bg-status-warning-bg/70 text-status-warning-text"
          >
            <Typography variant="small">
              Showing approximate counts. Project data is capped at 100 projects.
            </Typography>
          </CardSection>
        ) : null}

        <Grid cols={2} colsLg={4} gap="md">
          <MetricCard
            title="Total Issues"
            value={analytics.totalIssues}
            icon={TrendingUp}
            highlight
            testId={TEST_IDS.ANALYTICS.METRIC_TOTAL_ISSUES}
          />
          <MetricCard
            title="Completed"
            value={analytics.completedCount}
            icon={CheckCircle}
            testId={TEST_IDS.ANALYTICS.ORG_METRIC_COMPLETED}
          />
          <MetricCard
            title="Unassigned"
            value={analytics.unassignedCount}
            icon={Users}
            testId={TEST_IDS.ANALYTICS.ORG_METRIC_UNASSIGNED}
          />
          <MetricCard
            title="Projects"
            value={analytics.projectCount}
            icon={FolderKanban}
            testId={TEST_IDS.ANALYTICS.ORG_METRIC_PROJECTS}
          />
        </Grid>

        <Grid cols={1} colsLg={2} gap="md">
          <ChartCard
            title="Issues by Type"
            testId={TEST_IDS.ANALYTICS.ORG_CHART_TYPE}
            emptyStateTestId={TEST_IDS.ANALYTICS.ORG_EMPTY_STATE}
            emptyState={
              hasAnyIssues
                ? undefined
                : {
                    title: emptyStateCopy.title,
                    description: emptyStateCopy.description,
                  }
            }
          >
            <BarChart data={typeChartData} tone="brand" />
          </ChartCard>
          <ChartCard
            title="Issues by Priority"
            testId={TEST_IDS.ANALYTICS.ORG_CHART_PRIORITY}
            emptyState={
              hasAnyIssues
                ? undefined
                : {
                    title: emptyStateCopy.title,
                    description: emptyStateCopy.description,
                  }
            }
          >
            <BarChart data={priorityChartData} tone="warning" />
          </ChartCard>
        </Grid>

        <ChartCard
          title="Issues by Project (top 10)"
          testId={TEST_IDS.ANALYTICS.ORG_CHART_PROJECTS}
          emptyState={
            projectChartData.length > 0
              ? undefined
              : {
                  title: emptyStateCopy.title,
                  description: emptyStateCopy.description,
                }
          }
        >
          <BarChart data={projectChartData} tone="accent" />
        </ChartCard>

        {trend ? (
          <div data-testid={TEST_IDS.ANALYTICS.ORG_TREND_SECTION}>
            <TrendSection trend={trend} />
          </div>
        ) : null}

        <ProjectBreakdownSection
          projectBreakdown={analytics.projectBreakdown}
          emptyState={emptyStateCopy}
        />
      </PageStack>
    </PageLayout>
  );
}
