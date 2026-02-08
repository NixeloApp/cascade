import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { Clock, DollarSign, Download, TrendingUp, Users } from "@/lib/icons";
import { Card, CardBody } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Progress } from "../ui/Progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Typography } from "../ui/Typography";

// Pure functions - no need to be inside component
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatHours(hours: number): string {
  return hours.toFixed(2);
}

// Define BillingStats interface
interface BillingStats {
  hours: number;
  billableHours: number;
  cost: number;
  name: string;
  revenue: number;
  totalCost?: number;
}

interface BillingReportProps {
  projectId: Id<"projects">;
}

export function BillingReport({ projectId }: BillingReportProps) {
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("month");
  const project = useQuery(api.projects.getProject, { id: projectId });

  // Memoize date range calculation to prevent query key changes
  const dateRangeParams = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    switch (dateRange) {
      case "week":
        return { startDate: now - 7 * day, endDate: now };
      case "month":
        return { startDate: now - 30 * day, endDate: now };
      default:
        return {};
    }
  }, [dateRange]);

  const billing = useQuery(api.timeTracking.getProjectBilling, {
    projectId,
    ...dateRangeParams,
  });

  // Memoize derived calculations
  const { utilizationRate, averageRate, sortedUsers } = useMemo(() => {
    if (!billing) {
      return {
        utilizationRate: 0,
        averageRate: 0,
        sortedUsers: [] as [string, BillingStats][],
      };
    }

    const utilRate =
      billing.totalHours > 0 ? (billing.billableHours / billing.totalHours) * 100 : 0;
    const avgRate = billing.billableHours > 0 ? billing.totalRevenue / billing.billableHours : 0;
    const sorted = (Object.entries(billing.byUser) as [string, BillingStats][]).sort(
      (a, b) => (b[1].totalCost || 0) - (a[1].totalCost || 0),
    );

    return { utilizationRate: utilRate, averageRate: avgRate, sortedUsers: sorted };
  }, [billing]);

  if (!(billing && project)) {
    return (
      <Flex justify="center" align="center" className="p-8">
        <LoadingSpinner />
      </Flex>
    );
  }

  return (
    <div>
      {/* Header */}
      <Flex justify="between" align="center" className="mb-6">
        <div>
          <Typography variant="h2" className="text-2xl font-bold text-ui-text">
            Billing Report
          </Typography>
          <Typography className="text-sm text-ui-text-tertiary">
            {project.name} {project.clientName && `• ${project.clientName}`}
          </Typography>
        </div>
        <Flex gap="sm">
          <Select
            value={dateRange}
            onValueChange={(value) => {
              if (value === "week" || value === "month" || value === "all") {
                setDateRange(value);
              }
            }}
          >
            <SelectTrigger className="px-3 py-2 border border-ui-border rounded-md bg-ui-bg text-ui-text">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            className="px-4 py-2 bg-brand text-brand-foreground rounded-md hover:bg-brand-hover"
          >
            <Flex align="center" gap="sm">
              <Download className="w-4 h-4" />
              Export
            </Flex>
          </button>
        </Flex>
      </Flex>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody>
            <Flex align="center" gap="sm" className="text-sm text-ui-text-tertiary mb-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </Flex>
            <div className="text-3xl font-bold text-status-success">
              {formatCurrency(billing.totalRevenue)}
            </div>
            {project.budget && (
              <div className="text-xs text-ui-text-tertiary mt-1">
                of {formatCurrency(project.budget)} budget (
                {((billing.totalRevenue / project.budget) * 100).toFixed(0)}%)
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Flex align="center" gap="sm" className="text-sm text-ui-text-tertiary mb-2">
              <Clock className="w-4 h-4" />
              Billable Hours
            </Flex>
            <div className="text-3xl font-bold text-brand">
              {formatHours(billing.billableHours)}
            </div>
            <div className="text-xs text-ui-text-tertiary mt-1">
              of {formatHours(billing.totalHours)} total hours
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Flex align="center" gap="sm" className="text-sm text-ui-text-tertiary mb-2">
              <TrendingUp className="w-4 h-4" />
              Utilization Rate
            </Flex>
            <div className="text-3xl font-bold text-accent">{utilizationRate.toFixed(0)}%</div>
            <div className="text-xs text-ui-text-tertiary mt-1">
              {billing.nonBillableHours.toFixed(2)}h non-billable
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Flex align="center" gap="sm" className="text-sm text-ui-text-tertiary mb-2">
              <DollarSign className="w-4 h-4" />
              Avg Hourly Rate
            </Flex>
            <div className="text-3xl font-bold text-status-warning">
              {formatCurrency(averageRate)}
            </div>
            <div className="text-xs text-ui-text-tertiary mt-1">per billable hour</div>
          </CardBody>
        </Card>
      </div>

      {/* Team Breakdown */}
      <Card>
        <CardBody className="p-6">
          <Flex align="center" gap="sm" className="mb-4">
            <Users className="w-5 h-5 text-ui-text-tertiary" />
            <Typography variant="h3" className="text-lg font-semibold text-ui-text">
              Team Breakdown
            </Typography>
          </Flex>

          {sortedUsers.length === 0 ? (
            <div className="text-center py-8 text-ui-text-tertiary">
              No time entries recorded yet
            </div>
          ) : (
            <Flex direction="column" gap="md">
              {sortedUsers.map(([userId, stats]) => {
                const billingStats = stats as BillingStats;
                const userUtilization =
                  billingStats.hours > 0
                    ? (billingStats.billableHours / billingStats.hours) * 100
                    : 0;

                return (
                  <div key={userId} className="p-4 bg-ui-bg-secondary rounded-lg">
                    <Flex justify="between" align="center" className="mb-2">
                      <div>
                        <div className="font-medium text-ui-text">{billingStats.name}</div>
                        <div className="text-xs text-ui-text-tertiary">
                          {formatHours(billingStats.billableHours)} /{" "}
                          {formatHours(billingStats.hours)} hours ({userUtilization.toFixed(0)}%
                          billable)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-status-success">
                          {formatCurrency(billingStats.revenue)}
                        </div>
                        <div className="text-xs text-ui-text-tertiary">revenue</div>
                      </div>
                    </Flex>

                    {/* Progress bar */}
                    <Progress value={userUtilization} />
                  </div>
                );
              })}
            </Flex>
          )}
        </CardBody>
      </Card>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-ui-bg-secondary rounded-lg">
          <div className="text-2xl font-bold text-ui-text">{billing.entries}</div>
          <div className="text-sm text-ui-text-tertiary">Time Entries</div>
        </div>
        <div className="p-4 bg-ui-bg-secondary rounded-lg">
          <div className="text-2xl font-bold text-ui-text">
            {Object.keys(billing.byUser).length}
          </div>
          <div className="text-sm text-ui-text-tertiary">Team Members</div>
        </div>
        <div className="p-4 bg-ui-bg-secondary rounded-lg">
          <div className="text-2xl font-bold text-ui-text">
            {averageRate > 0 ? formatCurrency(averageRate) : "N/A"}
          </div>
          <div className="text-sm text-ui-text-tertiary">Blended Rate</div>
        </div>
      </div>
    </div>
  );
}
