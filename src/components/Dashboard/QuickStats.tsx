/**
 * Quick Stats
 *
 * Dashboard metrics cards showing user productivity data.
 * Displays assigned tasks, completed items, and high priority count.
 * Includes progress indicators and loading skeletons.
 */

import { useId } from "react";
import { Card, type CardProps } from "../ui/Card";
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
  recipe: NonNullable<CardProps["recipe"]>;
  valueClassName?: string;
  titleClassName?: string;
  progressIndicatorClassName?: string;
  progressValue?: number;
  valueVariant?: "dashboardStatValue" | "dashboardStatValueStrong";
}
interface StatCardConfig {
  title: string;
  statKey: keyof Stats;
  subtitle: string;
  recipe: NonNullable<CardProps["recipe"]>;
  valueClassName?: string;
  titleClassName?: string;
  progressIndicatorClassName?: string;
  valueVariant?: "dashboardStatValue" | "dashboardStatValueStrong";
}

const STAT_CARD_CONFIGS: readonly StatCardConfig[] = [
  {
    title: "Active Load",
    statKey: "assignedToMe",
    subtitle: "Assigned tasks",
    recipe: "metricTile",
    valueClassName: "text-brand",
  },
  {
    title: "Velocity",
    statKey: "completedThisWeek",
    subtitle: "Done this week",
    recipe: "metricTileSuccess",
    valueClassName: "text-status-success",
    progressIndicatorClassName: "bg-status-success",
  },
  {
    title: "Attention Needed",
    statKey: "highPriority",
    subtitle: "High Priority",
    recipe: "metricTileWarning",
    valueClassName: "text-status-warning",
    titleClassName: "text-status-warning",
    valueVariant: "dashboardStatValueStrong",
  },
  {
    title: "Contribution",
    statKey: "createdByMe",
    subtitle: "Reported issues",
    recipe: "metricTileAccent",
    valueClassName: "text-accent",
  },
] as const;

/**
 * Individual stat card component
 */
function StatCard({
  title,
  value,
  subtitle,
  recipe,
  titleClassName,
  valueClassName,
  progressIndicatorClassName,
  progressValue,
  valueVariant = "dashboardStatValue",
}: StatCardProps) {
  const progressId = useId();

  return (
    <Card recipe={recipe} padding="md" className="h-full">
      <Stack gap="sm">
        <Typography variant="eyebrowWide" className={titleClassName}>
          {title}
        </Typography>
        <Flex align="baseline" gap="sm" wrap>
          <Typography variant={valueVariant} className={valueClassName}>
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
            id={progressId}
            indicatorClassName={progressIndicatorClassName}
          />
        )}
      </Stack>
    </Card>
  );
}

function getStatAccentClasses(stats: Stats, config: StatCardConfig) {
  if (config.statKey !== "highPriority" || stats.highPriority > 0) {
    return {
      recipe: config.recipe,
      titleClassName: config.titleClassName,
      valueClassName: config.valueClassName,
    };
  }

  return {
    recipe: "metricTile" as const,
    titleClassName: undefined,
    valueClassName: undefined,
  };
}

/**
 * Dashboard quick stats cards showing high-density metrics
 */
export function QuickStats({ stats }: QuickStatsProps) {
  if (!stats) {
    return (
      <Grid cols={1} colsSm={2} colsLg={2} gap="sm">
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
    <Grid cols={1} colsSm={2} colsLg={2} gap="sm">
      {STAT_CARD_CONFIGS.map((config) => {
        const accentClasses = getStatAccentClasses(stats, config);

        return (
          <StatCard
            key={config.title}
            title={config.title}
            subtitle={config.subtitle}
            recipe={accentClasses.recipe}
            titleClassName={accentClasses.titleClassName}
            valueClassName={accentClasses.valueClassName}
            valueVariant={config.valueVariant}
            progressIndicatorClassName={config.progressIndicatorClassName}
            progressValue={
              config.statKey === "completedThisWeek" ? completionPercentage : undefined
            }
            value={stats[config.statKey]}
          />
        );
      })}
    </Grid>
  );
}
