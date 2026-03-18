import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart } from "@/components/Analytics/BarChart";
import { ChartCard } from "@/components/Analytics/ChartCard";
import { MetricCard } from "@/components/Analytics/MetricCard";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { CheckCircle, FolderKanban, TrendingUp, Users } from "@/lib/icons";

export const Route = createFileRoute("/_auth/_app/$orgSlug/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { organizationId } = useOrganization();
  const analytics = useAuthenticatedQuery(api.analytics.getOrgAnalytics, { organizationId });

  if (analytics === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

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

  const projectChartData = analytics.projectBreakdown.slice(0, 10).map((p) => ({
    label: p.key,
    value: p.issueCount,
  }));

  return (
    <PageLayout maxWidth="xl">
      <PageHeader
        title="Analytics"
        description="Organization-wide issue metrics and project health."
      />

      <Stack gap="lg">
        {analytics.isProjectsTruncated && (
          <Card padding="sm" variant="section">
            <Typography variant="small" color="secondary">
              Showing approximate counts. Project data is capped at 100 projects.
            </Typography>
          </Card>
        )}

        {/* Metric cards */}
        <Grid cols={2} colsLg={4} gap="md">
          <MetricCard
            title="Total Issues"
            value={analytics.totalIssues}
            icon={TrendingUp}
            highlight
          />
          <MetricCard title="Completed" value={analytics.completedCount} icon={CheckCircle} />
          <MetricCard title="Unassigned" value={analytics.unassignedCount} icon={Users} />
          <MetricCard title="Projects" value={analytics.projectCount} icon={FolderKanban} />
        </Grid>

        {/* Charts */}
        <Grid cols={1} colsLg={2} gap="md">
          <ChartCard title="Issues by Type">
            <BarChart data={typeChartData} color="bg-brand" />
          </ChartCard>
          <ChartCard title="Issues by Priority">
            <BarChart data={priorityChartData} color="bg-status-warning" />
          </ChartCard>
        </Grid>

        {/* Project breakdown */}
        {projectChartData.length > 0 && (
          <ChartCard title="Issues by Project (top 10)">
            <BarChart data={projectChartData} color="bg-accent" />
          </ChartCard>
        )}

        {/* Project list */}
        {analytics.projectBreakdown.length > 0 && (
          <Card padding="md">
            <Stack gap="sm">
              <Typography variant="h4">Project Breakdown</Typography>
              {analytics.projectBreakdown.map((project) => (
                <Card key={project.projectId} variant="section" padding="sm">
                  <Flex align="center" justify="between">
                    <div>
                      <Typography variant="label">{project.name}</Typography>
                      <Typography variant="caption" color="tertiary">
                        {project.key}
                      </Typography>
                    </div>
                    <Typography variant="h4">{project.issueCount}</Typography>
                  </Flex>
                </Card>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </PageLayout>
  );
}
