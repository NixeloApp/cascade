/**
 * Billing Report
 *
 * Financial reporting view for time tracking data.
 * Shows billable hours, revenue, team utilization, and project breakdowns.
 * Supports date range filtering and CSV/PDF export.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MONTH, WEEK } from "@convex/lib/timeUtils";
import { useState } from "react";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatDate } from "@/lib/formatting";
import type { LucideIcon } from "@/lib/icons";
import { Clock, DollarSign, Download, FileText, TrendingUp, Users } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card, CardBody } from "../ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Progress } from "../ui/Progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Stack } from "../ui/Stack";
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

interface SummaryMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  supportingText?: string;
  valueColor: "success" | "brand" | "accent" | "warning";
  recipe?: "metricTile" | "metricTileSuccess" | "metricTileAccent" | "metricTileWarning";
}

function SummaryMetricCard({
  icon,
  label,
  value,
  supportingText,
  valueColor,
  recipe = "metricTile",
}: SummaryMetricCardProps) {
  return (
    <Card recipe={recipe}>
      <CardBody>
        <Stack gap="sm">
          <Flex align="center" gap="sm">
            <Icon icon={icon} size="sm" tone="tertiary" />
            <Typography variant="small" color="tertiary">
              {label}
            </Typography>
          </Flex>
          <Typography variant="h2" color={valueColor}>
            {value}
          </Typography>
          {supportingText && (
            <Typography variant="caption" color="tertiary">
              {supportingText}
            </Typography>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
}

interface QuickStatCardProps {
  label: string;
  value: string | number;
}

function QuickStatCard({ label, value }: QuickStatCardProps) {
  return (
    <Card variant="soft">
      <CardBody>
        <Stack gap="xs" align="center">
          <Typography variant="h3">{value}</Typography>
          <Typography variant="small" color="tertiary">
            {label}
          </Typography>
        </Stack>
      </CardBody>
    </Card>
  );
}

interface TeamMemberBillingCardProps {
  billingStats: BillingStats;
}

function TeamMemberBillingCard({ billingStats }: TeamMemberBillingCardProps) {
  const userUtilization =
    billingStats.hours > 0 ? (billingStats.billableHours / billingStats.hours) * 100 : 0;

  return (
    <Card variant="section" padding="md">
      <Stack gap="sm">
        <Flex justify="between" align="center">
          <Stack gap="xs">
            <Typography variant="label">{billingStats.name}</Typography>
            <Typography variant="caption" color="tertiary">
              {formatHours(billingStats.billableHours)} / {formatHours(billingStats.hours)} hours (
              {userUtilization.toFixed(0)}% billable)
            </Typography>
          </Stack>
          <Stack gap="xs" align="end">
            <Typography variant="h4" color="success">
              {formatCurrency(billingStats.revenue)}
            </Typography>
            <Typography variant="caption" color="tertiary">
              revenue
            </Typography>
          </Stack>
        </Flex>

        <Progress value={userUtilization} />
      </Stack>
    </Card>
  );
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

/** Export billing data as PDF with summary and team breakdown table. */
async function exportBillingPdf(
  projectName: string,
  dateRange: string,
  billing: { totalRevenue: number; totalHours: number; billableHours: number; entries: number },
  users: [string, BillingStats][],
  utilizationRate: number,
  averageRate: number,
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const dateLabel =
    dateRange === "week" ? "Last 7 Days" : dateRange === "month" ? "Last 30 Days" : "All Time";
  const timestamp = formatDate(Date.now(), { year: "numeric", month: "long", day: "numeric" });

  // Title
  doc.setFontSize(18);
  doc.text(`${projectName} — Billing Report`, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${dateLabel} | Generated ${timestamp}`, 14, 28);

  // Summary section
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Summary", 14, 40);

  autoTable(doc, {
    startY: 44,
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", formatCurrency(billing.totalRevenue)],
      ["Total Hours", formatHours(billing.totalHours)],
      ["Billable Hours", formatHours(billing.billableHours)],
      ["Utilization Rate", `${utilizationRate.toFixed(0)}%`],
      ["Avg Hourly Rate", formatCurrency(averageRate)],
      ["Time Entries", String(billing.entries)],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold" } },
  });

  // Team breakdown
  const finalY =
    (doc as typeof doc & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 100;
  doc.setFontSize(12);
  doc.text("Team Breakdown", 14, finalY + 12);

  autoTable(doc, {
    startY: finalY + 16,
    head: [["Team Member", "Total Hours", "Billable Hours", "Utilization %", "Cost", "Revenue"]],
    body: users.map(([, stats]) => [
      stats.name,
      formatHours(stats.hours),
      formatHours(stats.billableHours),
      stats.hours > 0 ? `${Math.round((stats.billableHours / stats.hours) * 100)}%` : "0%",
      formatCurrency(stats.cost),
      formatCurrency(stats.revenue),
    ]),
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  });

  doc.save(`billing-${projectName.toLowerCase().replace(/\s+/g, "-")}-${dateRange}.pdf`);
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
    <Stack gap="xl">
      {/* Header */}
      <Flex justify="between" align="center">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button leftIcon={<Icon icon={Download} size="sm" />}>Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  exportBillingCsv(project.name, dateRange, billing, sortedUsers);
                  showSuccess("CSV exported");
                }}
              >
                <Icon icon={Download} size="sm" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={async () => {
                  try {
                    await exportBillingPdf(
                      project.name,
                      dateRange,
                      billing,
                      sortedUsers,
                      utilizationRate,
                      averageRate,
                    );
                    showSuccess("PDF exported");
                  } catch (error) {
                    showError(error, "PDF export failed");
                  }
                }}
              >
                <Icon icon={FileText} size="sm" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </Flex>

      {/* Summary Cards */}
      <Grid cols={1} colsMd={2} colsLg={4} gap="lg">
        <SummaryMetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(billing.totalRevenue)}
          valueColor="success"
          recipe="metricTileSuccess"
          supportingText={
            project.budget
              ? `of ${formatCurrency(project.budget)} budget (${((billing.totalRevenue / project.budget) * 100).toFixed(0)}%)`
              : undefined
          }
        />

        <SummaryMetricCard
          icon={Clock}
          label="Billable Hours"
          value={formatHours(billing.billableHours)}
          valueColor="brand"
          recipe="metricTile"
          supportingText={`of ${formatHours(billing.totalHours)} total hours`}
        />

        <SummaryMetricCard
          icon={TrendingUp}
          label="Utilization Rate"
          value={`${utilizationRate.toFixed(0)}%`}
          valueColor="accent"
          recipe="metricTileAccent"
          supportingText={`${billing.nonBillableHours.toFixed(2)}h non-billable`}
        />

        <SummaryMetricCard
          icon={DollarSign}
          label="Avg Hourly Rate"
          value={formatCurrency(averageRate)}
          valueColor="warning"
          recipe="metricTileWarning"
          supportingText="per billable hour"
        />
      </Grid>

      {/* Team Breakdown */}
      <Card>
        <CardBody>
          <Stack gap="lg">
            <Flex align="center" gap="sm">
              <Icon icon={Users} size="md" tone="tertiary" />
              <Typography variant="h3">Team Breakdown</Typography>
            </Flex>

            {sortedUsers.length === 0 ? (
              <Flex justify="center">
                <Typography color="tertiary">No time entries recorded yet</Typography>
              </Flex>
            ) : (
              <Stack gap="md">
                {sortedUsers.map(([userId, stats]) => (
                  <TeamMemberBillingCard key={userId} billingStats={stats} />
                ))}
              </Stack>
            )}
          </Stack>
        </CardBody>
      </Card>

      {/* Quick Stats */}
      <Grid cols={3} gap="lg">
        <QuickStatCard label="Time Entries" value={billing.entries} />
        <QuickStatCard label="Team Members" value={Object.keys(billing.byUser).length} />
        <QuickStatCard
          label="Blended Rate"
          value={averageRate > 0 ? formatCurrency(averageRate) : "N/A"}
        />
      </Grid>
    </Stack>
  );
}
