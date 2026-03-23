/**
 * Hour Compliance Dashboard
 *
 * Admin dashboard for monitoring team time tracking compliance.
 * Shows hours logged vs expected by user, team, and time period.
 * Highlights compliance issues and supports generating reports.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { AlertTriangle, CheckCircle, Gem, TrendingUp, XCircle, Zap } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { PageControlsGroup, PageControlsRow, SectionControls } from "../layout";
import { Button } from "../ui/Button";
import { Card, CardBody } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Dialog } from "../ui/Dialog";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { Input, Select, Textarea } from "../ui/form";
import { Grid } from "../ui/Grid";

type ComplianceStatus = "compliant" | "under_hours" | "over_hours" | "equity_under";

const STATUS_CONFIG: Record<
  ComplianceStatus,
  {
    icon: LucideIcon;
    color: React.ComponentProps<typeof Badge>["variant"];
    label: string;
  }
> = {
  compliant: {
    icon: CheckCircle,
    color: "success",
    label: "Compliant",
  },
  under_hours: {
    icon: AlertTriangle,
    color: "warning",
    label: "Under Hours",
  },
  over_hours: {
    icon: XCircle,
    color: "error",
    label: "Over Hours",
  },
  equity_under: {
    icon: Zap,
    color: "brand",
    label: "Equity Short",
  },
};

function toDateRange(startDate: string, endDate: string) {
  return {
    startDate: startDate ? new Date(startDate).getTime() : undefined,
    endDate: endDate ? new Date(endDate).getTime() : undefined,
  };
}

function getCurrentWeekRange() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return {
    periodType: "week" as const,
    periodStart: weekStart.getTime(),
    periodEnd: weekEnd.getTime(),
  };
}

function hasActiveFilters({
  selectedStatus,
  startDate,
  endDate,
}: {
  selectedStatus: ComplianceStatus | "all";
  startDate: string;
  endDate: string;
}) {
  return selectedStatus !== "all" || startDate !== "" || endDate !== "";
}

/**
 * Admin dashboard for monitoring contractor hour compliance and equity requirements.
 */
export function HourComplianceDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<ComplianceStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reviewingRecord, setReviewingRecord] = useState<Id<"hourComplianceRecords"> | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkAllConfirmOpen, setCheckAllConfirmOpen] = useState(false);
  const dateRange = toDateRange(startDate, endDate);

  // Queries
  const summary = useAuthenticatedQuery(
    api.hourCompliance.getComplianceSummary,
    startDate || endDate ? dateRange : {},
  );

  const records = useAuthenticatedQuery(api.hourCompliance.listComplianceRecords, {
    status: selectedStatus === "all" ? undefined : selectedStatus,
    ...dateRange,
    limit: 100,
  });

  const { mutate: reviewRecord } = useAuthenticatedMutation(
    api.hourCompliance.reviewComplianceRecord,
  );
  const { mutate: checkAllCompliance } = useAuthenticatedMutation(
    api.hourCompliance.checkAllUsersCompliance,
  );
  const shouldShowClearFilters = hasActiveFilters({ selectedStatus, startDate, endDate });

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRecord) return;

    setIsSubmitting(true);
    try {
      await reviewRecord({
        recordId: reviewingRecord,
        notes: reviewNotes || undefined,
      });
      showSuccess("Compliance record reviewed");
      setReviewingRecord(null);
      setReviewNotes("");
    } catch (error) {
      showError(error, "Failed to review record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckAllComplianceConfirm = async () => {
    try {
      await checkAllCompliance(getCurrentWeekRange());
      showSuccess("Compliance check initiated for all users");
    } catch (error) {
      showError(error, "Failed to check compliance");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Stack gap="lg" data-testid={TEST_IDS.SETTINGS.HOUR_COMPLIANCE_SECTION}>
      <Stack gap="xs">
        <Typography variant="h3">Hour Compliance</Typography>
        <Typography variant="p" color="secondary">
          Track employee, contractor, and equity hour compliance from one review surface.
        </Typography>
      </Stack>

      {summary && (
        <Stack gap="sm">
          <Grid cols={2} colsMd={5} gap="lg">
            <SummaryStatCard
              label="Compliance Rate"
              value={`${summary.complianceRate.toFixed(1)}%${summary.isTruncated ? "+" : ""}`}
            />
            <SummaryStatCard
              icon={CheckCircle}
              label="Compliant"
              value={summary.isTruncated ? `${summary.compliant}+` : summary.compliant}
              valueColor="success"
            />
            <SummaryStatCard
              icon={AlertTriangle}
              label="Under Hours"
              value={summary.isTruncated ? `${summary.underHours}+` : summary.underHours}
              valueColor="warning"
            />
            <SummaryStatCard
              icon={XCircle}
              label="Over Hours"
              value={summary.isTruncated ? `${summary.overHours}+` : summary.overHours}
              valueColor="error"
            />
            <SummaryStatCard
              icon={Gem}
              label="Equity Short"
              value={summary.isTruncated ? `${summary.equityUnder}+` : summary.equityUnder}
              valueColor="brand"
            />
          </Grid>
          {summary.isTruncated && (
            <Flex align="center" gap="xs">
              <AlertTriangle className="size-4 text-status-warning" />
              <Typography variant="caption" color="secondary">
                Showing first {summary.totalRecords} records. Narrow the date range for complete
                results.
              </Typography>
            </Flex>
          )}
        </Stack>
      )}

      <SectionControls gap="lg">
        <PageControlsRow>
          <Stack gap="xs">
            <Typography variant="label">Review filters</Typography>
            <Typography variant="small" color="secondary">
              Focus the list on specific compliance states or date ranges before reviewing records.
            </Typography>
          </Stack>

          <PageControlsGroup className="sm:justify-end">
            {shouldShowClearFilters ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedStatus("all");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear Filters
              </Button>
            ) : null}
            <Button onClick={() => setCheckAllConfirmOpen(true)} size="sm">
              Check All Users (This Week)
            </Button>
          </PageControlsGroup>
        </PageControlsRow>

        <ComplianceFilters
          selectedStatus={selectedStatus}
          startDate={startDate}
          endDate={endDate}
          onStatusChange={setSelectedStatus}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </SectionControls>

      <Card>
        <CardBody>
          <ComplianceRecordsList
            records={records}
            onReview={setReviewingRecord}
            onCheckAll={() => setCheckAllConfirmOpen(true)}
            formatDate={formatDate}
          />
        </CardBody>
      </Card>

      <Dialog
        open={!!reviewingRecord}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingRecord(null);
            setReviewNotes("");
          }
        }}
        title="Review Compliance Record"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setReviewingRecord(null);
                setReviewNotes("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="review-form" isLoading={isSubmitting}>
              Mark as Reviewed
            </Button>
          </>
        }
      >
        <form id="review-form" onSubmit={handleReview}>
          <Stack gap="lg">
            <Textarea
              label="Review Notes (Optional)"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes about this compliance record..."
              rows={4}
            />
          </Stack>
        </form>
      </Dialog>

      <ConfirmDialog
        isOpen={checkAllConfirmOpen}
        onClose={() => setCheckAllConfirmOpen(false)}
        onConfirm={handleCheckAllComplianceConfirm}
        title="Check Compliance"
        message="Check compliance for all active users this week?"
        variant="warning"
        confirmLabel="Check All"
      />
    </Stack>
  );
}

function ComplianceFilters({
  selectedStatus,
  startDate,
  endDate,
  onStatusChange,
  onStartDateChange,
  onEndDateChange,
}: {
  selectedStatus: ComplianceStatus | "all";
  startDate: string;
  endDate: string;
  onStatusChange: (status: ComplianceStatus | "all") => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}) {
  return (
    <Grid cols={1} colsMd={3} gap="lg">
      <Select
        label="Status"
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value as ComplianceStatus | "all")}
      >
        <option value="all">All Statuses</option>
        <option value="compliant">Compliant</option>
        <option value="under_hours">Under Hours</option>
        <option value="over_hours">Over Hours</option>
        <option value="equity_under">Equity Short</option>
      </Select>

      <Input
        label="Start Date"
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
      />

      <Input
        label="End Date"
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
      />
    </Grid>
  );
}

function ComplianceRecordsList({
  records,
  onReview,
  onCheckAll,
  formatDate,
}: {
  records:
    | ReturnType<typeof useAuthenticatedQuery<typeof api.hourCompliance.listComplianceRecords>>
    | undefined;
  onReview: (recordId: Id<"hourComplianceRecords">) => void;
  onCheckAll: () => void;
  formatDate: (timestamp: number) => string;
}) {
  if (!records) {
    return (
      <Flex justify="center" align="center" className="min-h-content-block">
        <Typography variant="small" color="secondary">
          Loading...
        </Typography>
      </Flex>
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No compliance records"
        description="Check compliance to start tracking"
        action={{
          label: "Check All Users",
          onClick: onCheckAll,
        }}
      />
    );
  }

  return (
    <Stack gap="sm">
      {records.map((record) => (
        <ComplianceRecordCard
          key={record._id}
          record={record}
          onReview={onReview}
          formatDate={formatDate}
        />
      ))}
    </Stack>
  );
}

function ComplianceRecordCard({
  record,
  onReview,
  formatDate,
}: {
  record: NonNullable<
    ReturnType<typeof useAuthenticatedQuery<typeof api.hourCompliance.listComplianceRecords>>
  >[number];
  onReview: (recordId: Id<"hourComplianceRecords">) => void;
  formatDate: (timestamp: number) => string;
}) {
  const statusConfig = STATUS_CONFIG[record.status];

  return (
    <Card padding="md" hoverable>
      <Flex justify="between" align="start" gap="md">
        <FlexItem flex="1">
          <Stack gap="md">
            <Flex gap="md" align="center">
              <Icon icon={statusConfig.icon} size="md" />
              <Stack gap="xs">
                <Typography variant="label">
                  {record.user?.name || record.user?.email || "Unknown User"}
                </Typography>
                <Flex gap="sm">
                  <Badge size="sm" variant={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                  <Badge variant="neutral" className="capitalize">
                    {record.periodType}ly
                  </Badge>
                  {record.reviewedBy ? <Badge variant="accent">Reviewed</Badge> : null}
                </Flex>
              </Stack>
            </Flex>

            <Grid cols={2} colsMd={4} gap="md">
              <MetricField
                label="Period"
                value={`${formatDate(record.periodStart)} - ${formatDate(record.periodEnd)}`}
              />
              <MetricField label="Hours Worked" value={`${record.totalHoursWorked.toFixed(1)}h`} />
              {record.hoursDeficit ? (
                <MetricField
                  label="Deficit"
                  value={`-${record.hoursDeficit.toFixed(1)}h`}
                  valueColor="warning"
                />
              ) : null}
              {record.hoursExcess ? (
                <MetricField
                  label="Excess"
                  value={`+${record.hoursExcess.toFixed(1)}h`}
                  valueColor="error"
                />
              ) : null}
              {record.equityHoursDeficit ? (
                <MetricField
                  label="Equity Short"
                  value={`-${record.equityHoursDeficit.toFixed(1)}h`}
                  valueColor="brand"
                />
              ) : null}
              {record.totalEquityHours ? (
                <MetricField
                  label="Equity Hours"
                  value={`${record.totalEquityHours.toFixed(1)}h`}
                />
              ) : null}
            </Grid>

            {record.reviewNotes ? (
              <div className="p-3 bg-ui-bg-secondary">
                <Typography variant="small">
                  <Typography as="strong" variant="strong">
                    Review Notes:
                  </Typography>{" "}
                  {record.reviewNotes}
                </Typography>
              </div>
            ) : null}
          </Stack>
        </FlexItem>

        {!record.reviewedBy ? (
          <Button variant="ghost" size="sm" onClick={() => onReview(record._id)}>
            Review
          </Button>
        ) : null}
      </Flex>
    </Card>
  );
}

function SummaryStatCard({
  icon,
  label,
  value,
  valueColor,
}: {
  icon?: LucideIcon;
  label: string;
  value: number | string;
  valueColor?: React.ComponentProps<typeof Typography>["color"];
}) {
  return (
    <Card>
      <CardBody>
        <Stack align="center" gap="xs">
          <Typography variant="h3" color={valueColor}>
            {value}
          </Typography>
          <Flex align="center" gap="xs">
            {icon ? <Icon icon={icon} size="sm" /> : null}
            <Typography variant="caption">{label}</Typography>
          </Flex>
        </Stack>
      </CardBody>
    </Card>
  );
}

function MetricField({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: React.ComponentProps<typeof Typography>["color"];
}) {
  return (
    <Stack gap="none">
      <Typography variant="meta">{label}</Typography>
      <Typography variant="label" color={valueColor}>
        {value}
      </Typography>
    </Stack>
  );
}
