import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Calendar, DollarSign, TrendingUp } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Progress } from "../ui/Progress";
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
      startDate: now - 7 * 24 * 60 * 60 * 1000,
      endDate: now,
      label: "Last 7 Days",
    },
    month: {
      startDate: now - 30 * 24 * 60 * 60 * 1000,
      endDate: now,
      label: "Last 30 Days",
    },
    quarter: {
      startDate: now - 90 * 24 * 60 * 60 * 1000,
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
      <Flex justify="center" align="center" className="p-8">
        <LoadingSpinner />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="xl">
      {/* Header with date range selector */}
      <Flex justify="between" align="center">
        <Typography variant="h2" className="text-lg font-semibold text-ui-text">
          Burn Rate & Team Costs
        </Typography>

        <Flex gap="sm">
          {(["week", "month", "quarter"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-lg transition-colors",
                dateRange === range
                  ? "bg-brand text-brand-foreground"
                  : "bg-ui-bg-tertiary text-ui-text hover:bg-ui-bg-secondary",
              )}
            >
              {ranges[range].label}
            </button>
          ))}
        </Flex>
      </Flex>

      {/* Burn Rate Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Hours Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-ui-bg border border-ui-border rounded-lg">
          <Typography variant="h3" className="text-sm font-medium text-ui-text mb-2">
            Total Hours
          </Typography>
          <Typography variant="h2" className="text-ui-text">
            {formatHours(burnRate.totalHours)}h
          </Typography>
          <Typography className="text-xs text-ui-text-tertiary mt-1">
            {burnRate.entriesCount} time entries
          </Typography>
        </div>

        <div className="p-4 bg-ui-bg border border-ui-border rounded-lg">
          <Typography variant="h3" className="text-sm font-medium text-ui-text mb-2">
            Billable Hours
          </Typography>
          <Typography variant="h2" color="success">
            {formatHours(burnRate.billableHours)}h
          </Typography>
          <Typography className="text-xs text-ui-text-tertiary mt-1">
            {formatCurrency(burnRate.billableCost)} billable
          </Typography>
        </div>
      </div>

      {/* Team Costs Breakdown */}
      <div>
        <Typography variant="h3" className="text-sm font-semibold text-ui-text mb-3">
          Team Costs Breakdown
        </Typography>

        {teamCosts.length === 0 ? (
          <div className="text-center p-8 bg-ui-bg-secondary rounded-lg">
            <Typography className="text-sm text-ui-text-tertiary">
              No time entries for this period
            </Typography>
          </div>
        ) : (
          <Flex direction="column" gap="sm">
            {(teamCosts as unknown as UserWithBurnRate[]).map((member) => {
              const percentOfTotal =
                burnRate.totalCost > 0 ? (member.cost / burnRate.totalCost) * 100 : 0;

              return (
                <div
                  key={member.user?._id || "unknown"}
                  className="p-4 bg-ui-bg border border-ui-border rounded-lg"
                >
                  <div className="mb-2">
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
                        <div>
                          <Typography variant="label" className="text-ui-text">
                            {member.user?.name || "Unknown"}
                          </Typography>
                          <Typography variant="caption" color="tertiary">
                            {formatHours(member.hours)}h total ({formatHours(member.billableHours)}h
                            billable)
                          </Typography>
                        </div>
                      </Flex>

                      <Flex direction="column" align="end">
                        <Typography variant="label" className="py-2 text-right text-ui-text">
                          {formatHours(member.hours)}
                        </Typography>
                        <Typography variant="label" className="py-2 text-right text-ui-text">
                          {formatHours(member.billableHours)}
                        </Typography>
                        <Typography variant="label" className="text-ui-text">
                          {formatCurrency(member.cost)}
                        </Typography>
                        <Typography variant="caption" color="tertiary">
                          {percentOfTotal.toFixed(0)}% of total
                        </Typography>
                      </Flex>
                    </Flex>
                  </div>

                  {/* Progress bar */}
                  <Progress value={percentOfTotal} />
                </div>
              );
            })}
          </Flex>
        )}
      </div>
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
    <div className={cn("p-4 border rounded-lg", colorClasses[color])}>
      <Flex align="center" gap="sm" className="mb-2">
        <Icon icon={icon} size="lg" />
        <Typography variant="caption" className="font-medium">
          {label}
        </Typography>
      </Flex>
      <Typography variant="h3" className="text-ui-text">
        {value}
      </Typography>
    </div>
  );
}
