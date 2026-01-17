import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
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
        icon="⏱️"
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
          leftIcon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          Add Time Entry
        </Button>
      </Flex>

      {groupedEntries.map(({ date, entries: dateEntries, duration }) => (
        <div key={date} className="space-y-3">
          {/* Date header */}
          <Flex justify="between" align="end" className="text-sm text-ui-text-secondary px-1">
            <span className="font-medium">{formatDate(new Date(date).getTime())}</span>
            <span>{formatDurationDisplay(duration)}</span>
          </Flex>

          <div className="bg-ui-bg-primary border border-ui-border-primary rounded-lg divide-y divide-ui-border-primary">
            {dateEntries.map((entry) => (
              <Flex
                align="start"
                gap="md"
                className="p-3 hover:bg-ui-bg-tertiary transition-colors group"
                key={entry._id}
              >
                {/* Details */}
                <div className="flex-1 min-w-0">
                  {entry.description && (
                    <Typography className="text-sm font-medium text-ui-text-primary">
                      {entry.description}
                    </Typography>
                  )}

                  <Flex align="center" gap="md" className="mt-1 text-xs text-ui-text-secondary">
                    {entry.activity && <Badge variant="neutral">{entry.activity}</Badge>}

                    {entry.project && (
                      <Flex align="center" gap="xs" className="inline-flex">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        {entry.project.name}
                      </Flex>
                    )}

                    {entry.issue && (
                      <Flex align="center" gap="xs" className="inline-flex">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {entry.issue.key}
                      </Flex>
                    )}

                    {entry.billable && <Badge variant="success">Billable</Badge>}

                    {entry.isLocked && (
                      <Flex align="center" gap="xs" className="inline-flex text-status-warning">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Locked
                      </Flex>
                    )}
                  </Flex>
                </div>

                {/* Duration and cost */}
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-ui-text-primary">
                    {formatDurationDisplay(entry.duration)}
                  </div>
                  {entry.totalCost !== undefined && entry.totalCost > 0 && (
                    <div className="text-xs text-ui-text-secondary">
                      {formatCurrency(entry.totalCost, entry.currency)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!(entry.isLocked || entry.billed) && (
                  <div className="shrink-0">
                    <Button
                      onClick={() => handleDelete(entry._id)}
                      variant="ghost"
                      size="sm"
                      className="p-1 min-w-0 text-ui-text-tertiary hover:text-status-error"
                      aria-label="Delete entry"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </div>
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
