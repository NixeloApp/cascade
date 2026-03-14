/**
 * Quick Stats
 *
 * Dashboard metrics cards showing user productivity data.
 * Displays assigned tasks, completed items, and high priority count.
 * Includes progress indicators and loading skeletons.
 */

import { cn } from "@/lib/utils";
import { Card } from "../ui/Card";
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
    glow: "from-brand-subtle/35",
  },
  success: {
    text: "text-status-success",
    bg: "bg-status-success",
    glow: "from-status-success/15",
  },
  accent: {
    text: "text-accent",
    bg: "bg-accent",
    glow: "from-accent/15",
  },
} as const;

/**
 * Individual stat card component
 */
function StatCard({ title, value, subtitle, variant, progressValue }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card
      hoverable
      variant="outline"
      padding="lg"
      className="group relative overflow-hidden border-ui-border/50 bg-ui-bg-soft/70 shadow-soft backdrop-blur-sm"
    >
      <div
        className={cn("absolute inset-x-0 top-0 h-16 bg-linear-to-b to-transparent", styles.glow)}
      />
      <div className={cn("absolute inset-x-4 top-0 h-0.5 rounded-full", styles.bg)} />
      <Stack gap="md" className="relative">
        <Typography
          variant="label"
          color="tertiary"
          className="text-caption uppercase tracking-widest"
        >
          {title}
        </Typography>
        <Flex align="baseline" gap="sm" wrap>
          <Typography variant="h2" className={cn("text-display-sm tracking-tight", styles.text)}>
            {value || 0}
          </Typography>
          <Typography variant="small" color="secondary">
            {subtitle}
          </Typography>
        </Flex>
        {progressValue !== undefined && (
          <Progress
            value={progressValue}
            className="h-1.5 bg-ui-bg-secondary/70"
            id="stat-progress"
            indicatorClassName={styles.bg}
          />
        )}
      </Stack>
    </Card>
  );
}

/**
 * High priority stat card
 */
function HighPriorityCard({ count }: { count: number }) {
  const hasHighPriority = count > 0;
  return (
    <Card
      variant="outline"
      padding="lg"
      className={cn(
        "relative overflow-hidden border-ui-border/50 bg-ui-bg-soft/70 shadow-soft backdrop-blur-sm",
        hasHighPriority && "border-status-warning/30",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-16 bg-linear-to-b to-transparent",
          hasHighPriority ? "from-status-warning/15" : "from-ui-bg-soft/20",
        )}
      />
      <Stack gap="md" className="relative">
        <Typography
          variant="label"
          className={cn(
            "text-caption uppercase tracking-widest",
            hasHighPriority ? "text-status-warning" : "text-ui-text-tertiary",
          )}
        >
          Attention Needed
        </Typography>
        <Flex align="baseline" gap="sm" wrap>
          <Typography
            variant="h2"
            className={cn(
              "text-3xl font-extrabold tracking-tight",
              hasHighPriority ? "text-status-warning" : "text-ui-text",
            )}
          >
            {count || 0}
          </Typography>
          <Typography variant="caption" color="secondary">
            High Priority
          </Typography>
        </Flex>
      </Stack>

      {hasHighPriority && (
        <div className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-status-warning" />
      )}
    </Card>
  );
}

/**
 * Dashboard quick stats cards showing high-density metrics
 */
export function QuickStats({ stats }: QuickStatsProps) {
  if (!stats) {
    return (
      <Grid cols={1} colsSm={2} colsLg={2} gap="md">
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
    <Grid cols={1} colsSm={2} colsLg={2} gap="md">
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
