import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Clock, DollarSign, Download, TrendingUp, Users } from "@/lib/icons";
import { Card, CardBody } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
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

  // Calculate date range parameters inline
  const dateRangeParams = (() => {
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
  })();

  const billing = useQuery(api.timeTracking.getProjectBilling, {
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
                  <Card key={userId} variant="soft">
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
                  </Card>
                );
              })}
            </Flex>
          )}
        </CardBody>
      </Card>

      {/* Quick Stats */}
      <Grid cols={3} gap="lg" className="mt-6 text-center">
        <Card variant="soft" className="text-center">
          <Typography variant="h3">{billing.entries}</Typography>
          <Typography variant="small" color="tertiary">
            Time Entries
          </Typography>
        </Card>
        <Card variant="soft" className="text-center">
          <Typography variant="h3">{Object.keys(billing.byUser).length}</Typography>
          <Typography variant="small" color="tertiary">
            Team Members
          </Typography>
        </Card>
        <Card variant="soft" className="text-center">
          <Typography variant="h3">
            {averageRate > 0 ? formatCurrency(averageRate) : "N/A"}
          </Typography>
          <Typography variant="small" color="tertiary">
            Blended Rate
          </Typography>
        </Card>
      </Grid>
    </div>
  );
}
