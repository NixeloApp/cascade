import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Typography } from "@/components/ui/Typography";
import { AlertTriangle, CheckCircle, Gem, TrendingUp, XCircle, Zap } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Dialog } from "../ui/Dialog";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { Input, Select, Textarea } from "../ui/form";
import { Grid } from "../ui/Grid";
import { LoadingSpinner } from "../ui/LoadingSpinner";

type ComplianceStatus = "compliant" | "under_hours" | "over_hours" | "equity_under";

export function HourComplianceDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<ComplianceStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reviewingRecord, setReviewingRecord] = useState<Id<"hourComplianceRecords"> | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const summary = useQuery(
    api.hourCompliance.getComplianceSummary,
    startDate || endDate
      ? {
          startDate: startDate ? new Date(startDate).getTime() : undefined,
          endDate: endDate ? new Date(endDate).getTime() : undefined,
        }
      : {},
  );

  const records = useQuery(api.hourCompliance.listComplianceRecords, {
    status: selectedStatus === "all" ? undefined : selectedStatus,
    startDate: startDate ? new Date(startDate).getTime() : undefined,
    endDate: endDate ? new Date(endDate).getTime() : undefined,
    limit: 100,
  });

  const reviewRecord = useMutation(api.hourCompliance.reviewComplianceRecord);
  const checkAllCompliance = useMutation(api.hourCompliance.checkAllUsersCompliance);

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

  const handleCheckAllCompliance = async () => {
    if (!confirm("Check compliance for all active users this week?")) return;

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
        return "bg-status-success/10 text-status-success";
      case "under_hours":
        return "bg-status-warning/10 text-status-warning";
      case "over_hours":
        return "bg-status-error/10 text-status-error";
      case "equity_under":
        return "bg-brand-subtle text-brand-hover";
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
          <Card>
            <CardBody>
              <div className="text-center">
                <Typography variant="h3" className="text-2xl">
                  {summary.complianceRate.toFixed(1)}%
                </Typography>
                <Typography variant="caption">Compliance Rate</Typography>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <Typography variant="h3" className="text-2xl" color="success">
                  {summary.compliant}
                </Typography>
                <Typography variant="caption">
                  <Icon icon={CheckCircle} size="sm" className="inline mr-1" /> Compliant
                </Typography>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <Typography variant="h3" className="text-2xl" color="warning">
                  {summary.underHours}
                </Typography>
                <Typography variant="caption">
                  <Icon icon={AlertTriangle} size="sm" className="inline mr-1" /> Under Hours
                </Typography>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <Typography variant="h3" className="text-2xl" color="error">
                  {summary.overHours}
                </Typography>
                <Typography variant="caption">
                  <Icon icon={XCircle} size="sm" className="inline mr-1" /> Over Hours
                </Typography>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <Typography variant="h3" className="text-2xl" color="brand">
                  {summary.equityUnder}
                </Typography>
                <Typography variant="caption">
                  <Icon icon={Gem} size="sm" className="inline mr-1" /> Equity Short
                </Typography>
              </div>
            </CardBody>
          </Card>
        </Grid>
      )}

      {/* Compliance Records */}
      <Card>
        <CardHeader
          title="Hour Compliance Records"
          description="Track employee/contractor/intern hour compliance"
          action={
            <Button onClick={handleCheckAllCompliance} size="sm">
              Check All Users (This Week)
            </Button>
          }
        />

        <CardBody>
          {/* Filters */}
          <Grid cols={1} colsMd={3} gap="lg" className="mb-6">
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

          {/* Records List */}
          {!records ? (
            <Flex align="center" justify="center" className="py-8">
              <LoadingSpinner />
            </Flex>
          ) : records.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No compliance records"
              description="Check compliance to start tracking"
              action={{
                label: "Check All Users",
                onClick: handleCheckAllCompliance,
              }}
            />
          ) : (
            <div className="space-y-3">
              {records?.map((record) => (
                <div
                  key={record._id}
                  className="p-4 border border-ui-border rounded-lg hover:bg-ui-bg-tertiary transition-colors"
                >
                  <Flex justify="between" align="start">
                    <FlexItem flex="1">
                      <Flex gap="md" align="center" className="mb-2">
                        <Icon icon={getStatusIcon(record.status)} size="md" />
                        <div>
                          <Typography variant="label">
                            {record.user?.name || record.user?.email || "Unknown User"}
                          </Typography>
                          <Flex gap="sm" className="mt-1">
                            <Badge size="sm" className={cn(getStatusColor(record.status))}>
                              {getStatusLabel(record.status)}
                            </Badge>
                            <Badge variant="neutral" className="capitalize">
                              {record.periodType}ly
                            </Badge>
                            {record.reviewedBy && <Badge variant="accent">Reviewed</Badge>}
                          </Flex>
                        </div>
                      </Flex>

                      <Grid cols={2} colsMd={4} gap="md" className="mt-3">
                        <div>
                          <Typography variant="meta">Period:</Typography>
                          <Typography variant="small" className="font-medium">
                            {formatDate(record.periodStart)} - {formatDate(record.periodEnd)}
                          </Typography>
                        </div>

                        <div>
                          <Typography variant="meta">Hours Worked:</Typography>
                          <Typography variant="small" className="font-medium">
                            {record.totalHoursWorked.toFixed(1)}h
                          </Typography>
                        </div>

                        {record.hoursDeficit && (
                          <div>
                            <Typography variant="meta">Deficit:</Typography>
                            <Typography variant="small" color="warning" className="font-medium">
                              -{record.hoursDeficit.toFixed(1)}h
                            </Typography>
                          </div>
                        )}

                        {record.hoursExcess && (
                          <div>
                            <Typography variant="meta">Excess:</Typography>
                            <Typography variant="small" color="error" className="font-medium">
                              +{record.hoursExcess.toFixed(1)}h
                            </Typography>
                          </div>
                        )}

                        {record.equityHoursDeficit && (
                          <div>
                            <Typography variant="meta">Equity Short:</Typography>
                            <Typography variant="small" color="brand" className="font-medium">
                              -{record.equityHoursDeficit.toFixed(1)}h
                            </Typography>
                          </div>
                        )}

                        {record.totalEquityHours && (
                          <div>
                            <Typography variant="meta">Equity Hours:</Typography>
                            <Typography variant="small" className="font-medium">
                              {record.totalEquityHours.toFixed(1)}h
                            </Typography>
                          </div>
                        )}
                      </Grid>

                      {record.reviewNotes && (
                        <Flex className="mt-3 p-2 bg-accent-subtle rounded">
                          <Typography variant="small">
                            <strong>Review Notes:</strong> {record.reviewNotes}
                          </Typography>
                        </Flex>
                      )}
                    </FlexItem>

                    <Flex gap="sm" className="ml-4">
                      {!record.reviewedBy && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReviewingRecord(record._id)}
                        >
                          Review
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                </div>
              ))}
            </div>
          )}
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
        className="sm:max-w-lg"
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
          <Flex direction="column" gap="lg">
            <Textarea
              label="Review Notes (Optional)"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes about this compliance record..."
              rows={4}
            />
          </Flex>
        </form>
      </Dialog>
    </Flex>
  );
}
