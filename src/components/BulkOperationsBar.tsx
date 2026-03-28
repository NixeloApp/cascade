/**
 * Bulk Operations Bar
 *
 * Floating action bar for multi-select issue operations.
 * Supports bulk status change, assignee update, deletion, and archival.
 * Shows count of selected items and available operations.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useId, useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Archive } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "./ui/Button";
import { getQuietCompactPillButtonClassName } from "./ui/buttonSurfaceClassNames";
import { Card, getCardRecipeClassName } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Flex, FlexItem } from "./ui/Flex";
import { Grid } from "./ui/Grid";
import { Icon } from "./ui/Icon";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

interface BulkOperationsBarProps {
  projectId: Id<"projects">;
  selectedIssueIds: Set<Id<"issues">>;
  onClearSelection: () => void;
  workflowStates: Array<{ id: string; name: string }>;
}

/**
 * Action bar for bulk operations on selected issues (status, assignee, archive).
 */
export function BulkOperationsBar({
  projectId,
  selectedIssueIds,
  onClearSelection,
  workflowStates,
}: BulkOperationsBarProps) {
  const [showActions, setShowActions] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  // Generate IDs for accessible labeling
  const statusId = useId();
  const priorityId = useId();
  const assigneeId = useId();
  const sprintId = useId();
  const labelId = useId();
  const removeLabelId = useId();
  const startDateId = useId();
  const dueDateId = useId();

  const sprints = useAuthenticatedQuery(api.sprints.listByProject, { projectId });
  const members = useAuthenticatedQuery(api.projectMembers.list, { projectId });

  const { mutate: bulkUpdateStatus } = useAuthenticatedMutation(api.issues.bulkUpdateStatus);
  const { mutate: bulkUpdatePriority } = useAuthenticatedMutation(api.issues.bulkUpdatePriority);
  const { mutate: bulkAssign } = useAuthenticatedMutation(api.issues.bulkAssign);
  const { mutate: bulkMoveToSprint } = useAuthenticatedMutation(api.issues.bulkMoveToSprint);
  const { mutate: bulkArchive } = useAuthenticatedMutation(api.issues.bulkArchive);
  const { mutate: bulkDelete } = useAuthenticatedMutation(api.issues.bulkDelete);
  const { mutate: bulkAddLabels } = useAuthenticatedMutation(api.issues.bulkAddLabels);
  const { mutate: bulkRemoveLabels } = useAuthenticatedMutation(api.issues.bulkRemoveLabels);
  const { mutate: bulkUpdateStartDate } = useAuthenticatedMutation(api.issues.bulkUpdateStartDate);
  const { mutate: bulkUpdateDueDate } = useAuthenticatedMutation(api.issues.bulkUpdateDueDate);

  const labels = useAuthenticatedQuery(api.labels.list, { projectId });

  const issueIds = Array.from(selectedIssueIds);
  const count = issueIds.length;

  const handleUpdateStatus = async (statusId: string) => {
    try {
      const result = await bulkUpdateStatus({ issueIds, newStatus: statusId });
      showSuccess(`Updated ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to update status");
    }
  };

  const handleUpdatePriority = async (priority: string) => {
    try {
      const result = await bulkUpdatePriority({
        issueIds,
        priority: priority as "lowest" | "low" | "medium" | "high" | "highest",
      });
      showSuccess(`Updated ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to update priority");
    }
  };

  const handleAssign = async (assigneeId: string) => {
    try {
      const result = await bulkAssign({
        issueIds,
        assigneeId: assigneeId === "unassigned" ? null : (assigneeId as Id<"users">),
      });
      showSuccess(`Assigned ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to assign issues");
    }
  };

  const handleMoveToSprint = async (sprintId: string) => {
    try {
      const result = await bulkMoveToSprint({
        issueIds,
        sprintId: sprintId === "backlog" ? null : (sprintId as Id<"sprints">),
      });
      showSuccess(`Moved ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to move to sprint");
    }
  };

  const handleAddLabel = async (labelName: string) => {
    try {
      const result = await bulkAddLabels({ issueIds, labels: [labelName] });
      showSuccess(`Added label to ${result.updated} issue(s)`);
    } catch (error) {
      showError(error, "Failed to add label");
    }
  };

  const handleRemoveLabel = async (labelName: string) => {
    try {
      const result = await bulkRemoveLabels({ issueIds, labels: [labelName] });
      showSuccess(`Removed label from ${result.updated} issue(s)`);
    } catch (error) {
      showError(error, "Failed to remove label");
    }
  };

  const handleUpdateStartDate = async (dateStr: string) => {
    if (!dateStr) return;
    try {
      const startDate = new Date(dateStr).getTime();
      const result = await bulkUpdateStartDate({ issueIds, startDate });
      if (result.updated > 0) {
        showSuccess(`Updated start date for ${result.updated} issue(s)`);
      } else {
        showError("No issues were updated. Start date cannot be after due date.");
      }
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to update start date");
    }
  };

  const handleUpdateDueDate = async (dateStr: string) => {
    if (!dateStr) return;
    try {
      const dueDate = new Date(dateStr).getTime();
      const result = await bulkUpdateDueDate({ issueIds, dueDate });
      if (result.updated > 0) {
        showSuccess(`Updated due date for ${result.updated} issue(s)`);
      } else {
        showError("No issues were updated. Due date cannot be before start date.");
      }
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to update due date");
    }
  };

  const handleClearStartDate = async () => {
    try {
      const result = await bulkUpdateStartDate({ issueIds, startDate: null });
      showSuccess(`Cleared start date for ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to clear start date");
    }
  };

  const handleClearDueDate = async () => {
    try {
      const result = await bulkUpdateDueDate({ issueIds, dueDate: null });
      showSuccess(`Cleared due date for ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to clear due date");
    }
  };

  const handleArchive = async () => {
    try {
      const result = await bulkArchive({ issueIds });
      if (result.archived > 0) {
        showSuccess(`Archived ${result.archived} issue(s)`);
      } else {
        showError("No issues were archived. Only completed issues can be archived.");
      }
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to archive issues");
    } finally {
      setArchiveConfirm(false);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await bulkDelete({ issueIds });
      showSuccess(`Deleted ${result.deleted} issue(s)`);
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to delete issues");
    } finally {
      setDeleteConfirm(false);
    }
  };

  if (count === 0) return null;

  return (
    <>
      <Card
        recipe="bulkActionBar"
        radius="none"
        className="fixed right-0 bottom-0 left-0 z-30 animate-slide-up"
      >
        <div className={getCardRecipeClassName("bulkActionContent")}>
          <Flex align="center" justify="between" gap="lg">
            <Flex align="center" gap="md">
              <Typography variant="label">
                {count} issue{count !== 1 ? "s" : ""} selected
              </Typography>
              <Button
                variant="unstyled"
                size="content"
                onClick={onClearSelection}
                className={getQuietCompactPillButtonClassName()}
              >
                Clear
              </Button>
            </Flex>

            <Flex align="center" gap="sm" wrap>
              <Button variant="outline" size="sm" onClick={() => setShowActions(!showActions)}>
                {showActions ? "Hide" : "Actions"}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setArchiveConfirm(true)}
                leftIcon={<Icon icon={Archive} size="sm" />}
              >
                Archive
              </Button>

              <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
                Delete
              </Button>
            </Flex>
          </Flex>

          {showActions && (
            <div className={getCardRecipeClassName("bulkActionDetails")}>
              <Grid cols={1} colsSm={2} colsMd={4} colsLg={8} gap="md">
                <Stack gap="xs">
                  <Typography as="label" htmlFor={statusId} variant="label" color="secondary">
                    Status
                  </Typography>
                  <Select
                    id={statusId}
                    onChange={handleUpdateStatus}
                    options={workflowStates.map((state) => ({
                      value: state.id,
                      label: state.name,
                    }))}
                    placeholder="Select status..."
                  />
                </Stack>

                <Stack gap="xs">
                  <Typography as="label" htmlFor={priorityId} variant="label" color="secondary">
                    Priority
                  </Typography>
                  <Select
                    id={priorityId}
                    onChange={handleUpdatePriority}
                    options={[
                      { value: "highest", label: "Highest" },
                      { value: "high", label: "High" },
                      { value: "medium", label: "Medium" },
                      { value: "low", label: "Low" },
                      { value: "lowest", label: "Lowest" },
                    ]}
                    placeholder="Select priority..."
                  />
                </Stack>

                <Stack gap="xs">
                  <Typography as="label" htmlFor={assigneeId} variant="label" color="secondary">
                    Assignee
                  </Typography>
                  <Select
                    id={assigneeId}
                    onChange={handleAssign}
                    options={[
                      { value: "unassigned", label: "Unassigned" },
                      ...(members?.map((member: { userId: string; userName: string }) => ({
                        value: member.userId,
                        label: member.userName,
                      })) ?? []),
                    ]}
                    placeholder="Select assignee..."
                  />
                </Stack>

                <Stack gap="xs">
                  <Typography as="label" htmlFor={sprintId} variant="label" color="secondary">
                    Sprint
                  </Typography>
                  <Select
                    id={sprintId}
                    onChange={handleMoveToSprint}
                    options={[
                      { value: "backlog", label: "Backlog" },
                      ...(sprints?.map((sprint) => ({
                        value: sprint._id,
                        label: sprint.name,
                      })) ?? []),
                    ]}
                    placeholder="Select sprint..."
                  />
                </Stack>

                <Stack gap="xs">
                  <Typography as="label" htmlFor={labelId} variant="label" color="secondary">
                    Add Label
                  </Typography>
                  <Select
                    id={labelId}
                    onChange={handleAddLabel}
                    options={
                      labels?.map((label) => ({ value: label.name, label: label.name })) ?? []
                    }
                    placeholder="Select label..."
                  />
                </Stack>

                <Stack gap="xs">
                  <Typography as="label" htmlFor={removeLabelId} variant="label" color="secondary">
                    Remove Label
                  </Typography>
                  <Select
                    id={removeLabelId}
                    onChange={handleRemoveLabel}
                    options={
                      labels?.map((label) => ({ value: label.name, label: label.name })) ?? []
                    }
                    placeholder="Select label..."
                  />
                </Stack>

                <Stack gap="xs">
                  <Typography as="label" htmlFor={startDateId} variant="label" color="secondary">
                    Start Date
                  </Typography>
                  <Flex gap="sm">
                    <FlexItem flex="1">
                      <Input
                        id={startDateId}
                        type="date"
                        onChange={(e) => handleUpdateStartDate(e.target.value)}
                      />
                    </FlexItem>
                    <Button
                      variant="unstyled"
                      size="content"
                      onClick={handleClearStartDate}
                      className={getQuietCompactPillButtonClassName()}
                    >
                      Clear
                    </Button>
                  </Flex>
                </Stack>

                <Stack gap="xs">
                  <Typography as="label" htmlFor={dueDateId} variant="label" color="secondary">
                    Due Date
                  </Typography>
                  <Flex gap="sm">
                    <FlexItem flex="1">
                      <Input
                        id={dueDateId}
                        type="date"
                        onChange={(e) => handleUpdateDueDate(e.target.value)}
                      />
                    </FlexItem>
                    <Button
                      variant="unstyled"
                      size="content"
                      onClick={handleClearDueDate}
                      className={getQuietCompactPillButtonClassName()}
                    >
                      Clear
                    </Button>
                  </Flex>
                </Stack>
              </Grid>
            </div>
          )}
        </div>
      </Card>

      {/* Archive Confirmation */}
      <ConfirmDialog
        isOpen={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        onConfirm={handleArchive}
        title="Archive Issues"
        message={`Archive ${count} issue${count !== 1 ? "s" : ""}? Only completed issues will be archived. Archived issues can be restored later.`}
        variant="info"
        confirmLabel="Archive"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Issues"
        message={`Are you sure you want to delete ${count} issue${count !== 1 ? "s" : ""}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </>
  );
}
