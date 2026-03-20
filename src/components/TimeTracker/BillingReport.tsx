/**
 * Billing Report
 *
 * Financial reporting view for time tracking data.
 * Shows billable hours, revenue, team utilization, and project breakdowns.
 * Supports date range filtering and CSV export.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MONTH, WEEK } from "@convex/lib/timeUtils";
import { useState } from "react";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Clock, DollarSign, Download, TrendingUp, Users } from "@/lib/icons";
import { showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card, CardBody } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
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

/** Calculate date range params for billing query */
function getDateRangeParams(dateRange: "week" | "month" | "all") {
  const now = Date.now();
  switch (dateRange) {
    case "week":
      return { startDate: now - WEEK, endDate: now };
    case "month":
      return { startDate: now - MONTH, endDate: now };
    default:
      return {};
  }
}

/** Export billing data as CSV and trigger browser download. */
function exportBillingCsv(
  projectName: string,
  dateRange: string,
  billing: { totalRevenue: number; totalHours: number; billableHours: number; entries: number },
  users: [string, BillingStats][],
): void {
  const rows = [
    ["Team Member", "Total Hours", "Billable Hours", "Utilization %", "Cost", "Revenue"],
    ...users.map(([, stats]) => [
      stats.name,
      formatHours(stats.hours),
      formatHours(stats.billableHours),
      stats.hours > 0 ? `${Math.round((stats.billableHours / stats.hours) * 100)}%` : "0%",
      formatCurrency(stats.cost),
      formatCurrency(stats.revenue),
    ]),
    [],
    ["Summary"],
    ["Total Hours", formatHours(billing.totalHours)],
    ["Billable Hours", formatHours(billing.billableHours)],
    ["Total Revenue", formatCurrency(billing.totalRevenue)],
    ["Time Entries", String(billing.entries)],
  ];

  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `billing-${projectName.toLowerCase().replace(/\s+/g, "-")}-${dateRange}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Time tracking billing report with exportable member time summaries. */
export function BillingReport({ projectId }: BillingReportProps) {
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("month");
  const project = useAuthenticatedQuery(api.projects.getProject, { id: projectId });

  // Calculate date range parameters
  const dateRangeParams = getDateRangeParams(dateRange);

  const billing = useAuthenticatedQuery(api.timeTracking.getProjectBilling, {
    projectId,
    ...dateRangeParams,
  });

  // Calculate derived values inline
  const utilizationRate =
    billing && billing.totalHours > 0 ? (billing.billableHours / billing.totalHours) * 100 : 0;
  const averageRate =
    billing && billing.billableHours > 0 ? billing.totalRevenue / billing.billableHours : 0;
  const sortedUsers = billing
    ? (Object.entries(billing.byUser) as [string, BillingStats][]).sort(
        (a, b) => (b[1].totalCost || 0) - (a[1].totalCost || 0),
      )
    : [];

  if (!(billing && project)) {
    return (
      <Flex justify="center" align="center">
        <LoadingSpinner />
      </Flex>
    );
  }

  return (
    <div>
      {/* Header */}
      <Flex justify="between" align="center" className="mb-6">
        <div>
          <Typography variant="h2">Billing Report</Typography>
          <Typography variant="small" color="tertiary">
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
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            leftIcon={<Icon icon={Download} size="sm" />}
            onClick={() => {
              exportBillingCsv(project.name, dateRange, billing, sortedUsers);
              showSuccess("Billing report exported");
            }}
          >
            Export
          </Button>
        </Flex>
      </Flex>

      {/* Summary Cards */}
      <Grid cols={1} colsMd={2} colsLg={4} gap="lg" className="mb-6">
        <Card>
          <CardBody>
            <Flex align="center" gap="sm" className="mb-2">
              <DollarSign className="w-4 h-4 text-ui-text-tertiary" />
              <Typography variant="small" color="tertiary">
                Total Revenue
              </Typography>
            </Flex>
            <Typography variant="h2" color="success">
              {formatCurrency(billing.totalRevenue)}
            </Typography>
            {project.budget && (
              <Typography variant="caption" color="tertiary" className="mt-1">
                of {formatCurrency(project.budget)} budget (
                {((billing.totalRevenue / project.budget) * 100).toFixed(0)}%)
              </Typography>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Flex align="center" gap="sm" className="mb-2">
              <Clock className="w-4 h-4 text-ui-text-tertiary" />
              <Typography variant="small" color="tertiary">
                Billable Hours
              </Typography>
            </Flex>
            <Typography variant="h2" color="brand">
              {formatHours(billing.billableHours)}
            </Typography>
            <Typography variant="caption" color="tertiary" className="mt-1">
              of {formatHours(billing.totalHours)} total hours
            </Typography>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Flex align="center" gap="sm" className="mb-2">
              <TrendingUp className="w-4 h-4 text-ui-text-tertiary" />
              <Typography variant="small" color="tertiary">
                Utilization Rate
              </Typography>
            </Flex>
            <Typography variant="h2" color="accent">
              {utilizationRate.toFixed(0)}%
            </Typography>
            <Typography variant="caption" color="tertiary" className="mt-1">
              {billing.nonBillableHours.toFixed(2)}h non-billable
            </Typography>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Flex align="center" gap="sm" className="mb-2">
              <DollarSign className="w-4 h-4 text-ui-text-tertiary" />
              <Typography variant="small" color="tertiary">
                Avg Hourly Rate
              </Typography>
            </Flex>
            <Typography variant="h2" color="warning">
              {formatCurrency(averageRate)}
            </Typography>
            <Typography variant="caption" color="tertiary" className="mt-1">
              per billable hour
            </Typography>
          </CardBody>
        </Card>
      </Grid>

      {/* Team Breakdown */}
      <Card>
        <CardBody>
          <Flex align="center" gap="sm" className="mb-4">
            <Users className="w-5 h-5 text-ui-text-tertiary" />
            <Typography variant="h3">Team Breakdown</Typography>
          </Flex>

          {sortedUsers.length === 0 ? (
            <Typography color="tertiary" className="text-center">
              No time entries recorded yet
            </Typography>
          ) : (
            <Flex direction="column" gap="md">
              {sortedUsers.map(([userId, stats]) => {
                const billingStats = stats as BillingStats;
                const userUtilization =
                  billingStats.hours > 0
                    ? (billingStats.billableHours / billingStats.hours) * 100
                    : 0;

                return (
                  <div key={userId} className="rounded bg-ui-bg-soft p-4">
                    <Flex justify="between" align="center" className="mb-2">
                      <div>
                        <Typography variant="label">{billingStats.name}</Typography>
                        <Typography variant="caption" color="tertiary">
                          {formatHours(billingStats.billableHours)} /{" "}
                          {formatHours(billingStats.hours)} hours ({userUtilization.toFixed(0)}%
                          billable)
                        </Typography>
                      </div>
                      <div className="text-right">
                        <Typography variant="h4" color="success">
                          {formatCurrency(billingStats.revenue)}
                        </Typography>
                        <Typography variant="caption" color="tertiary">
                          revenue
                        </Typography>
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
      <Grid cols={3} gap="lg" className="mt-6 text-center">
        <Card variant="soft" className="text-center">
          <CardBody>
            <Typography variant="h3">{billing.entries}</Typography>
            <Typography variant="small" color="tertiary">
              Time Entries
            </Typography>
          </CardBody>
        </Card>
        <Card variant="soft" className="text-center">
          <CardBody>
            <Typography variant="h3">{Object.keys(billing.byUser).length}</Typography>
            <Typography variant="small" color="tertiary">
              Team Members
            </Typography>
          </CardBody>
        </Card>
        <Card variant="soft" className="text-center">
          <CardBody>
            <Typography variant="h3">
              {averageRate > 0 ? formatCurrency(averageRate) : "N/A"}
            </Typography>
            <Typography variant="small" color="tertiary">
              Blended Rate
            </Typography>
          </CardBody>
        </Card>
      </Grid>
    </div>
  );
}
