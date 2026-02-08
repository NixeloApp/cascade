import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Clock, FileText, Folder, Lock, Plus, Trash } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Flex, FlexItem } from "../ui/Flex";
import { Typography } from "../ui/Typography";
import { TimeEntryModal } from "./TimeEntryModal";

interface TimeEntriesListProps {
  projectId?: Id<"projects">;
  userId?: Id<"users">;
  startDate?: number;
  endDate?: number;
  /** Whether billing is enabled for the organization */
  billingEnabled?: boolean;
}

export function TimeEntriesList({
  projectId,
  userId,
  startDate,
  endDate,
  billingEnabled,
}: TimeEntriesListProps) {
  const entries = useQuery(api.timeTracking.listTimeEntries, {
    projectId,
    userId,
    startDate,
    endDate,
    limit: 100,
  });

  const deleteEntry = useMutation(api.timeTracking.deleteTimeEntry);

  const [_editingEntry, _setEditingEntry] = useState<string | null>(null);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);

  // Format duration for display (hours and minutes)
  const formatDurationDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleDelete = async (entryId: Id<"timeEntries">) => {
    if (!confirm("Are you sure you want to delete this time entry?")) {
      return;
    }

    try {
      await deleteEntry({ entryId });
      showSuccess("Time entry deleted");
    } catch (error) {
      showError(error, "Failed to delete time entry");
    }
  };

  // Define the structure of the time entry returned by the API
  type TimeEntryWithDetails = FunctionReturnType<typeof api.timeTracking.listTimeEntries>[number];

  // Group entries by date
  const groupedEntries = useMemo(() => {
    if (!entries) return [];

    const grouped: Record<string, TimeEntryWithDetails[]> = {};
    const typedEntries: TimeEntryWithDetails[] = entries;

    typedEntries.forEach((entry) => {
      const dateKey = formatDate(entry.date); // Assuming entry.date is number (timestamp)
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });

    return Object.entries(grouped)
      .map(([date, group]) => ({
        date,
        entries: group.sort((a, b) => b.startTime - a.startTime),
        duration: group.reduce((sum, e) => sum + (e.duration || 0), 0),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries]);

  if (!entries) {
    return (
      <Flex justify="center" align="center" className="p-8">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No time entries"
        description="Start tracking time to see entries here."
      />
    );
  }

  return (
    <Flex direction="column" gap="xl">
      {/* Add Time Entry Button */}
      <Flex justify="end">
        <Button
          onClick={() => setShowManualEntryModal(true)}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Time Entry
        </Button>
      </Flex>

      {groupedEntries.map(({ date, entries: dateEntries, duration }) => (
        <div key={date} className="space-y-3">
          {/* Date header */}
          <Flex justify="between" align="end" className="text-ui-text-secondary px-1">
            <Typography variant="label" as="span">
              {formatDate(new Date(date).getTime())}
            </Typography>
            <Typography variant="small" as="span">
              {formatDurationDisplay(duration)}
            </Typography>
          </Flex>

          <div className="bg-ui-bg border border-ui-border rounded-lg divide-y divide-ui-border">
            {dateEntries.map((entry) => (
              <Flex
                align="start"
                gap="md"
                className="p-3 hover:bg-ui-bg-tertiary transition-colors group"
                key={entry._id}
              >
                {/* Details */}
                <FlexItem flex="1" className="min-w-0">
                  {entry.description && (
                    <Typography className="text-sm font-medium text-ui-text">
                      {entry.description}
                    </Typography>
                  )}

                  <Flex align="center" gap="md" className="mt-1 text-xs text-ui-text-secondary">
                    {entry.activity && <Badge variant="neutral">{entry.activity}</Badge>}

                    {entry.project && (
                      <Flex align="center" gap="xs" className="inline-flex">
                        <Folder className="w-3 h-3" />
                        {entry.project.name}
                      </Flex>
                    )}

                    {entry.issue && (
                      <Flex align="center" gap="xs" className="inline-flex">
                        <FileText className="w-3 h-3" />
                        {entry.issue.key}
                      </Flex>
                    )}

                    {entry.billable && <Badge variant="success">Billable</Badge>}

                    {entry.isLocked && (
                      <Flex align="center" gap="xs" className="inline-flex text-status-warning">
                        <Lock className="w-3 h-3" />
                        Locked
                      </Flex>
                    )}
                  </Flex>
                </FlexItem>

                {/* Duration and cost */}
                <FlexItem shrink={false} className="text-right">
                  <Typography variant="label" className="text-ui-text">
                    {formatDurationDisplay(entry.duration)}
                  </Typography>
                  {entry.totalCost !== undefined && entry.totalCost > 0 && (
                    <Typography variant="caption" color="secondary">
                      {formatCurrency(entry.totalCost, entry.currency)}
                    </Typography>
                  )}
                </FlexItem>

                {/* Actions */}
                {!(entry.isLocked || entry.billed) && (
                  <FlexItem shrink={false}>
                    <Button
                      onClick={() => handleDelete(entry._id)}
                      variant="ghost"
                      size="sm"
                      className="p-1 min-w-0 text-ui-text-tertiary hover:text-status-error"
                      aria-label="Delete entry"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </FlexItem>
                )}
              </Flex>
            ))}
          </div>
        </div>
      ))}

      {/* Time Entry Modal */}
      <TimeEntryModal
        open={showManualEntryModal}
        onOpenChange={setShowManualEntryModal}
        projectId={projectId}
        billingEnabled={billingEnabled}
      />
    </Flex>
  );
}
