import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { MONTH, WEEK } from "@convex/lib/timeUtils";
import { useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Calendar, DollarSign, TrendingUp } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
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
  user?: Doc<"users">;
  hours: number;
  billableHours: number;
}

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

  const burnRate = useQuery(api.timeTracking.getBurnRate, {
    projectId,
    startDate,
    endDate,
  });

  const teamCosts = useQuery(api.timeTracking.getTeamCosts, {
    projectId,
    startDate,
    endDate,
  });

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

        {teamCosts.length === 0 ? (
          <Card padding="lg" className="bg-ui-bg-secondary text-center">
            <Typography variant="small" color="tertiary">
              No time entries for this period
            </Typography>
          </Card>
        ) : (
          <Stack gap="sm">
            {(teamCosts as unknown as UserWithBurnRate[]).map((member) => {
              const percentOfTotal =
                burnRate.totalCost > 0 ? (member.cost / burnRate.totalCost) * 100 : 0;

              return (
                <Card key={member.user?._id || "unknown"} padding="md">
                  <Stack gap="sm">
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="md">
                        {member.user?.image ? (
                          <img
                            src={member.user.image}
                            alt={member.user.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <Flex
                            align="center"
                            justify="center"
                            className="w-8 h-8 rounded-full bg-ui-bg-tertiary text-sm font-medium text-ui-text-secondary"
                          >
                            {member.user?.name?.[0] || "?"}
                          </Flex>
                        )}
                        <Stack gap="none">
                          <Typography variant="label">{member.user?.name || "Unknown"}</Typography>
                          <Typography variant="caption" color="tertiary">
                            {formatHours(member.hours)}h total ({formatHours(member.billableHours)}h
                            billable)
                          </Typography>
                        </Stack>
                      </Flex>

                      <Stack gap="none" align="end">
                        <Typography variant="label" className="py-2 text-right">
                          {formatHours(member.hours)}
                        </Typography>
                        <Typography variant="label" className="py-2 text-right">
                          {formatHours(member.billableHours)}
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
  const colorClasses = {
    info: "bg-status-info-bg border-status-info/30",
    success: "bg-status-success-bg border-status-success/30",
    accent: "bg-accent-subtle border-accent-border",
    warning: "bg-status-warning-bg border-status-warning/30",
  };

  return (
    <Card padding="md" className={cn("border", colorClasses[color])}>
      <Flex align="center" gap="sm" className="mb-2">
        <Icon icon={icon} size="lg" />
        <Typography variant="caption" className="font-medium">
          {label}
        </Typography>
      </Flex>
      <Typography variant="h3" className="text-ui-text">
        {value}
      </Typography>
    </Card>
  );
}
