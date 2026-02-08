import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Flex } from "./ui/Flex";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { Typography } from "./ui/Typography";

interface BulkOperationsBarProps {
  projectId: Id<"projects">;
  selectedIssueIds: Set<Id<"issues">>;
  onClearSelection: () => void;
  workflowStates: Array<{ id: string; name: string }>;
}

export function BulkOperationsBar({
  projectId,
  selectedIssueIds,
  onClearSelection,
  workflowStates,
}: BulkOperationsBarProps) {
  const [showActions, setShowActions] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const _project = useQuery(api.projects.getProject, { id: projectId });
  const sprints = useQuery(api.sprints.listByProject, { projectId });
  const members = useQuery(api.projectMembers.list, { projectId });

  const bulkUpdateStatus = useMutation(api.issues.bulkUpdateStatus);
  const bulkUpdatePriority = useMutation(api.issues.bulkUpdatePriority);
  const bulkAssign = useMutation(api.issues.bulkAssign);
  const bulkMoveToSprint = useMutation(api.issues.bulkMoveToSprint);
  const bulkDelete = useMutation(api.issues.bulkDelete);

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
      <div className="fixed bottom-0 left-0 right-0 bg-ui-bg-elevated border-t border-ui-border shadow-elevated z-30 animate-slide-up">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Flex align="center" justify="between" gap="lg">
            {/* Selection Info */}
            <Flex align="center" gap="md">
              <Typography variant="p" className="font-medium text-ui-text">
                {count} issue{count !== 1 ? "s" : ""} selected
              </Typography>
              <Button
                variant="link"
                size="sm"
                onClick={onClearSelection}
                className="text-ui-text-secondary hover:text-ui-text"
              >
                Clear
              </Button>
            </Flex>

            {/* Actions */}
            <Flex align="center" gap="sm" className="flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowActions(!showActions)}>
                {showActions ? "Hide" : "Actions"}
              </Button>

              <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
                Delete
              </Button>
            </Flex>
          </Flex>

          {/* Expanded Actions */}
          {showActions && (
            <div className="mt-3 pt-3 border-t border-ui-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Status */}
                <div>
                  <Typography
                    variant="small"
                    className="block font-medium text-ui-text-secondary mb-1.5"
                  >
                    Status
                  </Typography>
                  <Select onValueChange={handleUpdateStatus}>
                    <SelectTrigger className="w-full">
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
                </div>

                {/* Priority */}
                <div>
                  <Typography
                    variant="small"
                    className="block font-medium text-ui-text-secondary mb-1.5"
                  >
                    Priority
                  </Typography>
                  <Select onValueChange={handleUpdatePriority}>
                    <SelectTrigger className="w-full">
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
                </div>

                {/* Assignee */}
                <div>
                  <Typography
                    variant="small"
                    className="block font-medium text-ui-text-secondary mb-1.5"
                  >
                    Assignee
                  </Typography>
                  <Select onValueChange={handleAssign}>
                    <SelectTrigger className="w-full">
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
                </div>

                {/* Sprint */}
                <div>
                  <Typography
                    variant="small"
                    className="block font-medium text-ui-text-secondary mb-1.5"
                  >
                    Sprint
                  </Typography>
                  <Select onValueChange={handleMoveToSprint}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sprint..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      {sprints?.map((sprint: Doc<"sprints">) => (
                        <SelectItem key={sprint._id} value={sprint._id}>
                          {sprint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
