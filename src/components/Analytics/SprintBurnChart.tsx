/**
 * Sprint Burn Chart
 * Shows burndown or burnup chart with toggle for sprint progress visualization
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Skeleton } from "../ui/Skeleton";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { ChartCard } from "./ChartCard";
import { LineChart } from "./LineChart";

type ChartMode = "burndown" | "burnup";

interface SprintBurnChartProps {
  sprintId: Id<"sprints">;
}

export function SprintBurnChart({ sprintId }: SprintBurnChartProps) {
  const [mode, setMode] = useState<ChartMode>("burndown");

  const burndownData = useQuery(api.analytics.getSprintBurndown, {
    sprintId,
  });

  if (burndownData === undefined) {
    return (
      <Card padding="lg">
        <Skeleton className="h-6 w-36 mb-4" />
        <Skeleton className="h-48 w-full" />
      </Card>
    );
  }

  if (!burndownData || burndownData.totalPoints === 0) {
    return (
      <ChartCard title="Sprint Progress">
        <Flex align="center" justify="center" className="h-48">
          <Typography variant="small" color="secondary">
            No story points in this sprint
          </Typography>
        </Flex>
      </ChartCard>
    );
  }

  const { totalPoints, idealBurndown, daysElapsed, totalDays, completedPoints } = burndownData;

  // Transform data based on mode
  const chartData = idealBurndown.map((point, index) => {
    // Calculate actual progress for each day
    // For simplicity, we interpolate current progress across elapsed days
    let actualValue: number;

    if (mode === "burndown") {
      // Burndown: remaining work
      if (index <= daysElapsed) {
        // Linear interpolation of current remaining points to the elapsed day
        const progressPerDay =
          (totalPoints - (totalPoints - completedPoints)) / Math.max(daysElapsed, 1);
        actualValue = totalPoints - progressPerDay * index;
      } else {
        // Future days - no actual data yet
        actualValue = totalPoints - completedPoints;
      }
    } else {
      // Burnup: completed work
      if (index <= daysElapsed) {
        const progressPerDay = completedPoints / Math.max(daysElapsed, 1);
        actualValue = progressPerDay * index;
      } else {
        actualValue = completedPoints;
      }
    }

    return {
      label: `Day ${point.day}`,
      value: Math.max(0, Math.round(actualValue)),
      idealValue: mode === "burndown" ? point.points : totalPoints - point.points, // Invert for burnup ideal
    };
  });

  // If we have elapsed days, only show up to current day + a few future days
  const visibleData =
    daysElapsed > 0 ? chartData.slice(0, Math.min(daysElapsed + 3, chartData.length)) : chartData;

  return (
    <ChartCard
      title={
        <Flex align="center" justify="between" className="w-full">
          <Typography variant="h5">
            {mode === "burndown" ? "Burndown Chart" : "Burnup Chart"}
          </Typography>
          <Flex gap="xs">
            <Button
              variant={mode === "burndown" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setMode("burndown")}
            >
              Burndown
            </Button>
            <Button
              variant={mode === "burnup" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setMode("burnup")}
            >
              Burnup
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Stack gap="md">
        {/* Chart */}
        <LineChart
          data={visibleData}
          color={mode === "burndown" ? "var(--color-status-error)" : "var(--color-status-success)"}
          height={200}
          showIdealLine
        />

        {/* Stats */}
        <Flex gap="lg" justify="center">
          <Stack gap="none" align="center">
            <Typography variant="h4">{totalPoints}</Typography>
            <Typography variant="caption" color="secondary">
              Total Points
            </Typography>
          </Stack>
          <Stack gap="none" align="center">
            <Typography variant="h4">{completedPoints}</Typography>
            <Typography variant="caption" color="secondary">
              Completed
            </Typography>
          </Stack>
          <Stack gap="none" align="center">
            <Typography variant="h4">{totalPoints - completedPoints}</Typography>
            <Typography variant="caption" color="secondary">
              Remaining
            </Typography>
          </Stack>
          {totalDays > 0 && (
            <Stack gap="none" align="center">
              <Typography variant="h4">
                {daysElapsed}/{totalDays}
              </Typography>
              <Typography variant="caption" color="secondary">
                Days
              </Typography>
            </Stack>
          )}
        </Flex>
      </Stack>
    </ChartCard>
  );
}
