import { cn } from "@/lib/utils";
import { Card, CardBody } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Progress } from "../ui/Progress";
import { SkeletonStatCard } from "../ui/Skeleton";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface Stats {
  assignedToMe: number;
  completedThisWeek: number;
  highPriority: number;
  createdByMe: number;
}

interface QuickStatsProps {
  stats: Stats | undefined;
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  variant: "brand" | "success" | "accent";
  progressValue?: number;
}

const variantStyles = {
  brand: {
    text: "text-brand",
    bg: "bg-brand",
  },
  success: {
    text: "text-status-success",
    bg: "bg-status-success",
  },
  accent: {
    text: "text-accent",
    bg: "bg-accent",
  },
} as const;

/**
 * Individual stat card component
 */
function StatCard({ title, value, subtitle, variant, progressValue }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className="relative overflow-hidden group hover:shadow-card-hover transition-shadow">
      {/* Colored left border accent */}
      <div className={cn("absolute left-0 top-0 h-full w-1", styles.bg)} />
      <CardBody className="pl-6">
        <Stack gap="sm">
          <Typography
            variant="small"
            color="tertiary"
            className="text-caption uppercase tracking-wider font-bold"
          >
            {title}
          </Typography>
          <Flex align="baseline" gap="xs">
            <Typography variant="h2" className={cn("text-3xl font-extrabold", styles.text)}>
              {value || 0}
            </Typography>
            <Typography variant="small" color="secondary" className="text-xs">
              {subtitle}
            </Typography>
          </Flex>
          {progressValue !== undefined && (
            <Progress
              value={progressValue}
              className="h-1.5"
              id="stat-progress"
              indicatorClassName={styles.bg}
            />
          )}
        </Stack>
      </CardBody>
    </Card>
  );
}

/**
 * High priority stat card
 */
function HighPriorityCard({ count }: { count: number }) {
  const hasHighPriority = count > 0;
  return (
    <Card className={cn("relative overflow-hidden", hasHighPriority && "border-status-warning/30")}>
      <CardBody>
        <Stack gap="sm">
          <Typography
            variant="small"
            className={cn(
              "text-caption uppercase tracking-wider font-bold",
              hasHighPriority ? "text-status-warning" : "text-ui-text-tertiary",
            )}
          >
            Attention Needed
          </Typography>
          <Flex align="baseline" gap="xs">
            <Typography
              variant="h2"
              className={cn(
                "text-3xl font-extrabold",
                hasHighPriority ? "text-status-warning" : "text-ui-text",
              )}
            >
              {count || 0}
            </Typography>
            <Typography variant="small" color="secondary" className="text-xs">
              High Priority
            </Typography>
          </Flex>
        </Stack>

        {hasHighPriority && (
          <div className="absolute right-0 top-0 h-full w-1.5 bg-status-warning" />
        )}
      </CardBody>
    </Card>
  );
}

/**
 * Dashboard quick stats cards showing high-density metrics
 */
export function QuickStats({ stats }: QuickStatsProps) {
  if (!stats) {
    return (
      <Grid cols={1} colsSm={2} colsLg={4} gap="lg" className="mb-8">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </Grid>
    );
  }

  // Calculate completion percentage for the progress bar
  const totalAssigned = stats.assignedToMe + stats.completedThisWeek;
  const completionPercentage =
    totalAssigned > 0 ? (stats.completedThisWeek / totalAssigned) * 100 : 0;

  return (
    <Grid cols={1} colsSm={2} colsLg={4} gap="lg" className="mb-8">
      <StatCard
        title="Active Load"
        value={stats.assignedToMe}
        subtitle="Assigned tasks"
        variant="brand"
      />
      <StatCard
        title="Velocity"
        value={stats.completedThisWeek}
        subtitle="Done this week"
        variant="success"
        progressValue={completionPercentage}
      />
      <HighPriorityCard count={stats.highPriority} />
      <StatCard
        title="Contribution"
        value={stats.createdByMe}
        subtitle="Reported issues"
        variant="accent"
      />
    </Grid>
  );
}
