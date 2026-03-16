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
import { Card, getCardRecipeClassName } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Flex, FlexItem } from "./ui/Flex";
import { Grid } from "./ui/Grid";
import { Icon } from "./ui/Icon";
import { Input } from "./ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
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
  const { mutate: bulkUpdateStartDate } = useAuthenticatedMutation(api.issues.bulkUpdateStartDate);
  const { mutate: bulkUpdateDueDate } = useAuthenticatedMutation(api.issues.bulkUpdateDueDate);

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
              <Button chrome="quiet" chromeSize="compactPill" onClick={onClearSelection}>
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
              <Grid cols={1} colsSm={2} colsMd={3} colsLg={6} gap="md">
                <Stack gap="xs">
                  <Typography as="label" htmlFor={statusId} variant="label" color="secondary">
                    Status
                  </Typography>
                  <Select onValueChange={handleUpdateStatus}>
                    <SelectTrigger id={statusId}>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workflowStates.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Stack>

                <Stack gap="xs">
                  <Typography as="label" htmlFor={priorityId} variant="label" color="secondary">
                    Priority
                  </Typography>
                  <Select onValueChange={handleUpdatePriority}>
                    <SelectTrigger id={priorityId}>
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="highest">Highest</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="lowest">Lowest</SelectItem>
                    </SelectContent>
                  </Select>
                </Stack>

                <Stack gap="xs">
                  <Typography as="label" htmlFor={assigneeId} variant="label" color="secondary">
                    Assignee
                  </Typography>
                  <Select onValueChange={handleAssign}>
                    <SelectTrigger id={assigneeId}>
                      <SelectValue placeholder="Select assignee..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members?.map((member: { userId: string; userName: string }) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.userName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Stack>

                <Stack gap="xs">
                  <Typography as="label" htmlFor={sprintId} variant="label" color="secondary">
                    Sprint
                  </Typography>
                  <Select onValueChange={handleMoveToSprint}>
                    <SelectTrigger id={sprintId}>
                      <SelectValue placeholder="Select sprint..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      {sprints?.map((sprint) => (
                        <SelectItem key={sprint._id} value={sprint._id}>
                          {sprint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Button chrome="quiet" chromeSize="compactPill" onClick={handleClearStartDate}>
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
                    <Button chrome="quiet" chromeSize="compactPill" onClick={handleClearDueDate}>
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
