/**
 * Time Entries List
 *
 * Displays paginated time entries for a user or project.
 * Shows entry details with issue links, duration, and billing status.
 * Supports editing, deleting, and adding new time entries.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ListItem, ListItemActions, ListItemContent, ListItemMeta } from "@/components/ui/ListItem";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { Clock, Download, FileText, Folder, Lock, Plus, Trash } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Flex } from "../ui/Flex";
import { IconButton } from "../ui/IconButton";
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

/** Filterable list of time entries with edit and delete actions. */
export function TimeEntriesList({
  projectId,
  userId,
  startDate,
  endDate,
  billingEnabled,
}: TimeEntriesListProps) {
  const entries = useAuthenticatedQuery(api.timeTracking.listTimeEntries, {
    projectId,
    userId,
    startDate,
    endDate,
    limit: 100,
  });

  const { mutate: deleteEntry } = useAuthenticatedMutation(api.timeTracking.deleteTimeEntry);

  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<Id<"timeEntries"> | null>(null);

  // Format duration for display (hours and minutes)
  const formatDurationDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleDeleteClick = (entryId: Id<"timeEntries">) => {
    setPendingDeleteId(entryId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return;

    try {
      await deleteEntry({ entryId: pendingDeleteId });
      showSuccess("Time entry deleted");
    } catch (error) {
      showError(error, "Failed to delete time entry");
    } finally {
      setPendingDeleteId(null);
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
      <Card padding="xl" variant="ghost">
        <Flex justify="center" align="center">
          <LoadingSpinner size="lg" />
        </Flex>
      </Card>
    );
  }

  const handleExportCsv = () => {
    if (!entries || entries.length === 0) return;

    const rows = [
      ["Date", "Description", "Issue", "Project", "Duration (h)", "Billable"],
      ...entries.map((entry) => [
        formatDate(entry.startTime),
        entry.description || "",
        entry.issue?.key || "",
        entry.project?.name || "",
        (entry.duration / 3600).toFixed(2),
        entry.billable ? "Yes" : "No",
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `time-entries-${formatDate(Date.now())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess("CSV exported");
  };

  const headerCard = (
    <Card variant="flat" padding="md">
      <Flex justify="between" align="center" gap="md" wrap>
        <Stack gap="xs">
          <Typography variant="label">Recent entries</Typography>
          <Typography variant="caption" color="secondary">
            Review logged work, fix mistakes quickly, and add time before the week closes.
          </Typography>
        </Stack>
        <Flex gap="sm">
          {entries && entries.length > 0 && (
            <Button
              onClick={handleExportCsv}
              variant="secondary"
              size="sm"
              leftIcon={<Icon icon={Download} size="sm" />}
            >
              Export CSV
            </Button>
          )}
          <Button
            onClick={() => setShowManualEntryModal(true)}
            variant="primary"
            size="sm"
            leftIcon={<Icon icon={Plus} size="sm" />}
            data-testid={TEST_IDS.TIME_TRACKING.ADD_ENTRY_BUTTON}
          >
            Add Time Entry
          </Button>
        </Flex>
      </Flex>
    </Card>
  );

  if (entries.length === 0) {
    return (
      <Flex direction="column" gap="xl" data-testid={TEST_IDS.TIME_TRACKING.ENTRIES_LIST}>
        {headerCard}
        <EmptyState
          icon={Clock}
          title="No time entries"
          description="Start tracking time to see entries here."
          data-testid={TEST_IDS.TIME_TRACKING.ENTRIES_EMPTY_STATE}
        />
        <TimeEntryModal
          open={showManualEntryModal}
          onOpenChange={setShowManualEntryModal}
          projectId={projectId}
          billingEnabled={billingEnabled}
        />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="xl" data-testid={TEST_IDS.TIME_TRACKING.ENTRIES_LIST}>
      {headerCard}

      {groupedEntries.map(({ date: isoDate, entries: dateEntries, duration }) => (
        <Stack key={isoDate} gap="sm">
          {/* Date header */}
          <Flex justify="between" align="end">
            <Typography variant="label" color="secondary" as="span">
              {formatDate(new Date(`${isoDate}T00:00:00`).getTime())}
            </Typography>
            <Typography variant="small" color="secondary" as="span">
              {formatDurationDisplay(duration)}
            </Typography>
          </Flex>

          <Stack gap="xs">
            {dateEntries.map((entry) => (
              <Card
                key={entry._id}
                variant="outline"
                padding="none"
                hoverable={!(entry.isLocked || entry.billed)}
              >
                <ListItem size="md">
                  <ListItemContent>
                    <Stack gap="xs">
                      {entry.description && (
                        <Typography variant="label">{entry.description}</Typography>
                      )}

                      <Flex align="center" gap="md" wrap>
                        {entry.activity && <Badge variant="neutral">{entry.activity}</Badge>}

                        {entry.project && (
                          <Flex align="center" gap="xs">
                            <Icon icon={Folder} size="xs" />
                            <Typography variant="meta" color="secondary">
                              {entry.project.name}
                            </Typography>
                          </Flex>
                        )}

                        {entry.issue && (
                          <Flex align="center" gap="xs">
                            <Icon icon={FileText} size="xs" />
                            <Typography variant="meta" color="secondary">
                              {entry.issue.key}
                            </Typography>
                          </Flex>
                        )}

                        {entry.billable && <Badge variant="success">Billable</Badge>}

                        {entry.isLocked && (
                          <Badge variant="warning">
                            <Flex as="span" inline align="center" gap="xs">
                              <Icon icon={Lock} size="xs" />
                              <span>Locked</span>
                            </Flex>
                          </Badge>
                        )}
                      </Flex>
                    </Stack>
                  </ListItemContent>

                  <ListItemMeta>
                    <Stack gap="xs" align="end">
                      <Typography variant="label">
                        {formatDurationDisplay(entry.duration)}
                      </Typography>
                      {entry.totalCost !== undefined && entry.totalCost > 0 && (
                        <Typography variant="caption" color="secondary">
                          {formatCurrency(entry.totalCost, entry.currency)}
                        </Typography>
                      )}
                    </Stack>
                  </ListItemMeta>

                  {!(entry.isLocked || entry.billed) && (
                    <ListItemActions>
                      <IconButton
                        onClick={() => handleDeleteClick(entry._id)}
                        variant="danger"
                        size="sm"
                        aria-label="Delete entry"
                      >
                        <Icon icon={Trash} size="sm" />
                      </IconButton>
                    </ListItemActions>
                  )}
                </ListItem>
              </Card>
            ))}
          </Stack>
        </Stack>
      ))}

      {/* Time Entry Modal */}
      <TimeEntryModal
        open={showManualEntryModal}
        onOpenChange={setShowManualEntryModal}
        projectId={projectId}
        billingEnabled={billingEnabled}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Time Entry"
        message="Are you sure you want to delete this time entry?"
        variant="danger"
        confirmLabel="Delete"
      />
    </Flex>
  );
}
