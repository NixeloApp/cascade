/**
 * Burn Rate Dashboard
 *
 * Project financial dashboard showing burn rate and budget metrics.
 * Displays weekly/monthly spend, team utilization, and cost projections.
 * Supports date range filtering and per-user cost breakdown.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MONTH, WEEK } from "@convex/lib/timeUtils";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Calendar, DollarSign, TrendingUp } from "@/lib/icons";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Progress } from "../ui/Progress";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface BurnRateDashboardProps {
  projectId: Id<"projects">;
}

interface UserWithBurnRate {
  cost: number;
  hours: number;
  billableHours: number;
  billableCost: number;
  user: {
    _id: Id<"users">;
    name: string;
    email?: string;
    image?: string;
  } | null;
}

const METRIC_CARD_RECIPES = {
  info: "metricTileInfo",
  success: "metricTileSuccess",
  accent: "metricTileAccent",
  warning: "metricTileWarning",
} as const;

const METRIC_BADGE_VARIANTS = {
  info: "info",
  success: "success",
  accent: "accent",
  warning: "warning",
} as const;

/** Dashboard showing billable hours, burn rate, and utilization metrics. */
export function BurnRateDashboard({ projectId }: BurnRateDashboardProps) {
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter">("month");

  // Calculate date range
  const now = Date.now();
  const ranges = {
    week: {
      startDate: now - WEEK,
      endDate: now,
      label: "Last 7 Days",
    },
    month: {
      startDate: now - MONTH,
      endDate: now,
      label: "Last 30 Days",
    },
    quarter: {
      startDate: now - 3 * MONTH,
      endDate: now,
      label: "Last 90 Days",
    },
  };

  const { startDate, endDate } = ranges[dateRange];

  const burnRate = useAuthenticatedQuery(api.timeTracking.getBurnRate, {
    projectId,
    startDate,
    endDate,
  });

  const teamCosts = useAuthenticatedQuery(api.timeTracking.getTeamCosts, {
    projectId,
    startDate,
    endDate,
  });
  const teamCostEntries = (teamCosts ?? []) as UserWithBurnRate[];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(1);
  };

  if (!(burnRate && teamCosts)) {
    return (
      <Card padding="xl" variant="ghost">
        <Flex justify="center" align="center">
          <LoadingSpinner />
        </Flex>
      </Card>
    );
  }

  return (
    <Flex direction="column" gap="xl">
      {/* Header with date range selector */}
      <Flex justify="between" align="center">
        <Typography variant="h2">Burn Rate & Team Costs</Typography>

        <Flex gap="sm">
          {(["week", "month", "quarter"] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? "primary" : "secondary"}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {ranges[range].label}
            </Button>
          ))}
        </Flex>
      </Flex>

      {/* Burn Rate Metrics */}
      <Grid cols={1} colsMd={4} gap="lg">
        <MetricCard
          label="Total Cost"
          value={formatCurrency(burnRate.totalCost)}
          icon={DollarSign}
          color="info"
        />
        <MetricCard
          label="Per Day"
          value={formatCurrency(burnRate.burnRatePerDay)}
          icon={Calendar}
          color="success"
        />
        <MetricCard
          label="Per Week"
          value={formatCurrency(burnRate.burnRatePerWeek)}
          icon={TrendingUp}
          color="accent"
        />
        <MetricCard
          label="Per Month"
          value={formatCurrency(burnRate.burnRatePerMonth)}
          icon={Calendar}
          color="warning"
        />
      </Grid>

      {/* Hours Breakdown */}
      <Grid cols={1} colsMd={2} gap="lg">
        <Card padding="md">
          <Stack gap="xs">
            <Typography variant="label">Total Hours</Typography>
            <Typography variant="h2">{formatHours(burnRate.totalHours)}h</Typography>
            <Typography variant="caption">{burnRate.entriesCount} time entries</Typography>
          </Stack>
        </Card>

        <Card padding="md">
          <Stack gap="xs">
            <Typography variant="label">Billable Hours</Typography>
            <Typography variant="h2" color="success">
              {formatHours(burnRate.billableHours)}h
            </Typography>
            <Typography variant="caption">
              {formatCurrency(burnRate.billableCost)} billable
            </Typography>
          </Stack>
        </Card>
      </Grid>

      {/* Team Costs Breakdown */}
      <Stack gap="md">
        <Typography variant="h3">Team Costs Breakdown</Typography>

        {teamCostEntries.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No time entries for this period"
            description="Track work during this range to see burn rate and team cost breakdowns."
            size="compact"
          />
        ) : (
          <Stack gap="sm">
            {teamCostEntries.map((member) => {
              const percentOfTotal =
                burnRate.totalCost > 0 ? (member.cost / burnRate.totalCost) * 100 : 0;

              return (
                <Card key={member.user?._id || "unknown"} padding="md">
                  <Stack gap="sm">
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="md">
                        <Avatar
                          src={member.user?.image}
                          name={member.user?.name}
                          email={member.user?.email}
                          size="md"
                          variant="neutral"
                        />
                        <Stack gap="none">
                          <Typography variant="label">{member.user?.name || "Unknown"}</Typography>
                          <Typography variant="caption" color="tertiary">
                            {formatHours(member.hours)}h total ({formatHours(member.billableHours)}h
                            billable)
                          </Typography>
                        </Stack>
                      </Flex>

                      <Stack gap="none" align="end">
                        <Typography variant="label">{formatHours(member.hours)}h</Typography>
                        <Typography variant="label">
                          {formatHours(member.billableHours)}h
                        </Typography>
                        <Typography variant="label">{formatCurrency(member.cost)}</Typography>
                        <Typography variant="caption" color="tertiary">
                          {percentOfTotal.toFixed(0)}% of total
                        </Typography>
                      </Stack>
                    </Flex>

                    {/* Progress bar */}
                    <Progress value={percentOfTotal} />
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Flex>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: "info" | "success" | "accent" | "warning";
}

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  return (
    <Card recipe={METRIC_CARD_RECIPES[color]} padding="md">
      <Stack gap="sm">
        <Badge variant={METRIC_BADGE_VARIANTS[color]} shape="pill" size="md">
          <Flex as="span" align="center" gap="xs">
            <Icon icon={icon} size="sm" />
            <span>{label}</span>
          </Flex>
        </Badge>
        <Typography variant="h3">{value}</Typography>
      </Stack>
    </Card>
  );
}
