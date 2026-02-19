import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Clock, FileText, Folder, Lock, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Stack } from "@/components/ui/Stack";
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

  // Group entries by date inline using ISO date string as key for stable parsing
  const groupedEntries = entries
    ? (() => {
        const grouped: Record<string, TimeEntryWithDetails[]> = {};
        const typedEntries: TimeEntryWithDetails[] = entries;

        typedEntries.forEach((entry) => {
          // Use ISO date string (YYYY-MM-DD) as key for stable parsing
          const dateKey = new Date(entry.date).toISOString().split("T")[0];
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(entry);
        });

        return Object.entries(grouped)
          .map(([isoDate, group]) => ({
            date: isoDate, // ISO format: YYYY-MM-DD
            entries: group.sort((a, b) => b.startTime - a.startTime),
            duration: group.reduce((sum, e) => sum + (e.duration || 0), 0),
          }))
          .sort((a, b) => b.date.localeCompare(a.date)); // ISO strings sort correctly
      })()
    : [];

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

      {groupedEntries.map(({ date: isoDate, entries: dateEntries, duration }) => (
        <Stack key={isoDate} gap="sm">
          {/* Date header */}
          <Flex justify="between" align="end" className="px-1">
            <Typography variant="label" color="secondary" as="span">
              {formatDate(new Date(`${isoDate}T00:00:00`).getTime())}
            </Typography>
            <Typography variant="small" color="secondary" as="span">
              {formatDurationDisplay(duration)}
            </Typography>
          </Flex>

          <Card padding="none" className="divide-y divide-ui-border">
            {dateEntries.map((entry) => (
              <Flex
                align="start"
                gap="md"
                className="p-3 hover:bg-ui-bg-tertiary transition-colors group"
                key={entry._id}
              >
                {/* Details */}
                <FlexItem flex="1" className="min-w-0">
                  <Stack gap="xs">
                    {entry.description && (
                      <Typography variant="label">{entry.description}</Typography>
                    )}

                    <Flex align="center" gap="md">
                      {entry.activity && <Badge variant="neutral">{entry.activity}</Badge>}

                      {entry.project && (
                        <Flex align="center" gap="xs">
                          <Folder className="w-3 h-3" />
                          <Typography variant="meta" color="secondary">
                            {entry.project.name}
                          </Typography>
                        </Flex>
                      )}

                      {entry.issue && (
                        <Flex align="center" gap="xs">
                          <FileText className="w-3 h-3" />
                          <Typography variant="meta" color="secondary">
                            {entry.issue.key}
                          </Typography>
                        </Flex>
                      )}

                      {entry.billable && <Badge variant="success">Billable</Badge>}

                      {entry.isLocked && (
                        <Flex align="center" gap="xs" className="text-status-warning">
                          <Lock className="w-3 h-3" />
                          <Typography variant="meta" color="warning">
                            Locked
                          </Typography>
                        </Flex>
                      )}
                    </Flex>
                  </Stack>
                </FlexItem>

                {/* Duration and cost */}
                <FlexItem shrink={false} className="text-right">
                  <Typography variant="label">{formatDurationDisplay(entry.duration)}</Typography>
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
          </Card>
        </Stack>
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
