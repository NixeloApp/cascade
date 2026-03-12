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
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Dialog } from "../ui/Dialog";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { Input, Select, Textarea } from "../ui/form";
import { Grid } from "../ui/Grid";

type ComplianceStatus = "compliant" | "under_hours" | "over_hours" | "equity_under";

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

  // Queries
  const summary = useAuthenticatedQuery(
    api.hourCompliance.getComplianceSummary,
    startDate || endDate
      ? {
          startDate: startDate ? new Date(startDate).getTime() : undefined,
          endDate: endDate ? new Date(endDate).getTime() : undefined,
        }
      : {},
  );

  const records = useAuthenticatedQuery(api.hourCompliance.listComplianceRecords, {
    status: selectedStatus === "all" ? undefined : selectedStatus,
    startDate: startDate ? new Date(startDate).getTime() : undefined,
    endDate: endDate ? new Date(endDate).getTime() : undefined,
    limit: 100,
  });

  const { mutate: reviewRecord } = useAuthenticatedMutation(
    api.hourCompliance.reviewComplianceRecord,
  );
  const { mutate: checkAllCompliance } = useAuthenticatedMutation(
    api.hourCompliance.checkAllUsersCompliance,
  );

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
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Sunday
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      await checkAllCompliance({
        periodType: "week",
        periodStart: weekStart.getTime(),
        periodEnd: weekEnd.getTime(),
      });
      showSuccess("Compliance check initiated for all users");
    } catch (error) {
      showError(error, "Failed to check compliance");
    }
  };

  const getStatusIcon = (status: ComplianceStatus): LucideIcon => {
    switch (status) {
      case "compliant":
        return CheckCircle;
      case "under_hours":
        return AlertTriangle;
      case "over_hours":
        return XCircle;
      case "equity_under":
        return Zap;
    }
  };

  const getStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case "compliant":
        return "success";
      case "under_hours":
        return "warning";
      case "over_hours":
        return "error";
      case "equity_under":
        return "brand";
    }
  };

  const getStatusLabel = (status: ComplianceStatus) => {
    switch (status) {
      case "compliant":
        return "Compliant";
      case "under_hours":
        return "Under Hours";
      case "over_hours":
        return "Over Hours";
      case "equity_under":
        return "Equity Short";
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
    <Flex direction="column" gap="xl">
      {/* Summary Stats */}
      {summary && (
        <Grid cols={2} colsMd={5} gap="lg">
          <SummaryStatCard
            label="Compliance Rate"
            value={`${summary.complianceRate.toFixed(1)}%`}
          />
          <SummaryStatCard
            icon={CheckCircle}
            label="Compliant"
            value={summary.compliant}
            valueColor="success"
          />
          <SummaryStatCard
            icon={AlertTriangle}
            label="Under Hours"
            value={summary.underHours}
            valueColor="warning"
          />
          <SummaryStatCard
            icon={XCircle}
            label="Over Hours"
            value={summary.overHours}
            valueColor="error"
          />
          <SummaryStatCard
            icon={Gem}
            label="Equity Short"
            value={summary.equityUnder}
            valueColor="brand"
          />
        </Grid>
      )}

      {/* Compliance Records */}
      <Card>
        <CardHeader
          title="Hour Compliance Records"
          description="Track employee/contractor/intern hour compliance"
          action={
            <Button onClick={() => setCheckAllConfirmOpen(true)} size="sm">
              Check All Users (This Week)
            </Button>
          }
        />

        <CardBody>
          <Stack gap="lg">
            <Grid cols={1} colsMd={3} gap="lg">
              <Select
                label="Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ComplianceStatus | "all")}
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
                onChange={(e) => setStartDate(e.target.value)}
              />

              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Grid>

            {!records ? (
              <Flex justify="center" align="center" className="min-h-32">
                <Typography variant="small" color="secondary">
                  Loading...
                </Typography>
              </Flex>
            ) : records.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No compliance records"
                description="Check compliance to start tracking"
                action={{
                  label: "Check All Users",
                  onClick: () => setCheckAllConfirmOpen(true),
                }}
              />
            ) : (
              <Stack gap="sm">
                {records.map((record) => (
                  <Card key={record._id} padding="md" hoverable>
                    <Flex justify="between" align="start" gap="md">
                      <FlexItem flex="1">
                        <Stack gap="md">
                          <Flex gap="md" align="center">
                            <Icon icon={getStatusIcon(record.status)} size="md" />
                            <Stack gap="xs">
                              <Typography variant="label">
                                {record.user?.name || record.user?.email || "Unknown User"}
                              </Typography>
                              <Flex gap="sm">
                                <Badge size="sm" variant={getStatusColor(record.status)}>
                                  {getStatusLabel(record.status)}
                                </Badge>
                                <Badge variant="neutral" className="capitalize">
                                  {record.periodType}ly
                                </Badge>
                                {record.reviewedBy ? (
                                  <Badge variant="accent">Reviewed</Badge>
                                ) : null}
                              </Flex>
                            </Stack>
                          </Flex>

                          <Grid cols={2} colsMd={4} gap="md">
                            <MetricField
                              label="Period"
                              value={`${formatDate(record.periodStart)} - ${formatDate(record.periodEnd)}`}
                            />
                            <MetricField
                              label="Hours Worked"
                              value={`${record.totalHoursWorked.toFixed(1)}h`}
                            />
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
                            <Card variant="flat" padding="sm">
                              <Typography variant="small">
                                <strong>Review Notes:</strong> {record.reviewNotes}
                              </Typography>
                            </Card>
                          ) : null}
                        </Stack>
                      </FlexItem>

                      {!record.reviewedBy ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReviewingRecord(record._id)}
                        >
                          Review
                        </Button>
                      ) : null}
                    </Flex>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </CardBody>
      </Card>

      {/* Review Modal */}
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
    </Flex>
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
