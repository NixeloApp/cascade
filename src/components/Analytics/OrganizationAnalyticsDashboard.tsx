import { ChartCard } from "@/components/Analytics/ChartCard";
import { MetricCard } from "@/components/Analytics/MetricCard";
import { PageHeader, PageLayout, PageStack } from "@/components/layout";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { InsetPanel } from "@/components/ui/InsetPanel";
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

interface OrganizationAnalyticsDashboardProps {
  analytics: OrganizationAnalyticsData;
  headerActions?: React.ReactNode;
}

function ProjectBreakdownSection({
  projectBreakdown,
}: {
  projectBreakdown: ProjectBreakdownItem[];
}) {
  if (projectBreakdown.length === 0) {
    return null;
  }

  return (
    <AnalyticsSection
      title="Project Breakdown"
      description={`Issue counts across ${projectBreakdown.length} active project${projectBreakdown.length === 1 ? "" : "s"}.`}
    >
      <Stack gap="sm">
        {projectBreakdown.map((project) => (
          <InsetPanel key={project.projectId} size="compact">
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
          </InsetPanel>
        ))}
      </Stack>
    </AnalyticsSection>
  );
}

/** Organization-wide analytics dashboard aligned to the shared analytics shell. */
export function OrganizationAnalyticsDashboard({
  analytics,
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

  return (
    <PageLayout maxWidth="xl">
      <PageStack>
        <PageHeader
          title="Analytics"
          description="Organization-wide issue metrics and project health."
          spacing="stack"
          actions={headerActions}
        />

        {analytics.isProjectsTruncated ? (
          <InsetPanel
            size="compact"
            className="border-status-warning/20 bg-status-warning-bg/70 text-status-warning-text"
          >
            <Typography variant="small">
              Showing approximate counts. Project data is capped at 100 projects.
            </Typography>
          </InsetPanel>
        ) : null}

        <Grid cols={2} colsLg={4} gap="md">
          <MetricCard
            title="Total Issues"
            value={analytics.totalIssues}
            icon={TrendingUp}
            highlight
            testId={TEST_IDS.ANALYTICS.METRIC_TOTAL_ISSUES}
          />
          <MetricCard title="Completed" value={analytics.completedCount} icon={CheckCircle} />
          <MetricCard title="Unassigned" value={analytics.unassignedCount} icon={Users} />
          <MetricCard title="Projects" value={analytics.projectCount} icon={FolderKanban} />
        </Grid>

        <Grid cols={1} colsLg={2} gap="md">
          <ChartCard title="Issues by Type">
            <BarChart data={typeChartData} color="bg-brand" />
          </ChartCard>
          <ChartCard title="Issues by Priority">
            <BarChart data={priorityChartData} color="bg-status-warning" />
          </ChartCard>
        </Grid>

        {projectChartData.length > 0 ? (
          <ChartCard title="Issues by Project (top 10)">
            <BarChart data={projectChartData} color="bg-accent" />
          </ChartCard>
        ) : null}

        <ProjectBreakdownSection projectBreakdown={analytics.projectBreakdown} />
      </PageStack>
    </PageLayout>
  );
}
