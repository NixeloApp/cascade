import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { Flex, FlexItem } from "../ui/Flex";
import { Checkbox } from "../ui/form/Checkbox";
import { Input } from "../ui/form/Input";
import { Metadata, MetadataItem } from "../ui/Metadata";
import { Progress } from "../ui/Progress";
import { Typography } from "../ui/Typography";

interface Subtask {
  _id: Id<"issues">;
  key: string;
  title: string;
  status: string;
  assignee?: { name?: string | null; email?: string } | null;
  [key: string]: unknown;
}

interface SubtasksListProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
  subtasks: Subtask[] | undefined;
}

/**
 * Displays and manages sub-tasks for an issue
 * Includes progress tracking, creation form, and list
 * Extracted from IssueDetailModal for better organization
 */
export function SubtasksList({ issueId, projectId, subtasks }: SubtasksListProps) {
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const createIssue = useMutation(api.issues.create);

  const handleCreateSubtask = async () => {
    if (!subtaskTitle.trim()) return;

    try {
      await createIssue({
        projectId,
        title: subtaskTitle.trim(),
        type: "subtask",
        priority: "medium",
        parentId: issueId,
      });
      showSuccess("Sub-task created");
      setSubtaskTitle("");
      setIsCreatingSubtask(false);
    } catch (error) {
      showError(error, "Failed to create sub-task");
    }
  };

  // Calculate sub-task progress
  const completedSubtasks =
    subtasks?.filter((st) => st.status === "done" || st.status === "completed").length || 0;
  const totalSubtasks = subtasks?.length || 0;

  return (
    <div>
      <Flex justify="between" align="center" className="mb-3">
        <Typography variant="h3" className="text-sm font-medium text-ui-text">
          Sub-tasks
          {totalSubtasks > 0 && (
            <Typography variant="caption" color="tertiary" as="span" className="ml-2">
              ({completedSubtasks}/{totalSubtasks} completed)
            </Typography>
          )}
        </Typography>
        <button
          type="button"
          onClick={() => setIsCreatingSubtask(true)}
          className="text-sm text-brand hover:text-brand-hover:text-brand-ring font-medium"
        >
          + Add Sub-task
        </button>
      </Flex>

      {/* Progress bar */}
      {totalSubtasks > 0 && (
        <Progress value={(completedSubtasks / totalSubtasks) * 100} className="mb-3" />
      )}

      {/* Create sub-task form */}
      {isCreatingSubtask && (
        <div className="mb-3 p-3 border border-ui-border rounded-lg bg-ui-bg-secondary">
          <Input
            type="text"
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            placeholder="Sub-task title..."
            className="mb-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateSubtask();
              } else if (e.key === "Escape") {
                setIsCreatingSubtask(false);
                setSubtaskTitle("");
              }
            }}
            autoFocus
          />
          <Flex gap="sm">
            <button
              type="button"
              onClick={handleCreateSubtask}
              className="px-3 py-1 bg-brand-main text-ui-bg rounded hover:bg-brand-secondary text-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingSubtask(false);
                setSubtaskTitle("");
              }}
              className="px-3 py-1 bg-ui-bg-tertiary text-ui-text rounded hover:bg-ui-bg-tertiary text-sm"
            >
              Cancel
            </button>
          </Flex>
        </div>
      )}

      {/* Sub-task list */}
      {subtasks && subtasks.length > 0 ? (
        <Flex direction="column" gap="sm">
          {subtasks.map((subtask) => (
            <Flex
              key={subtask._id}
              gap="sm"
              align="start"
              className="p-2 rounded hover:bg-ui-bg-secondary group"
            >
              <Checkbox
                checked={subtask.status === "done" || subtask.status === "completed"}
                onChange={() => {
                  // Toggle sub-task completion
                  // You can implement this later with a mutation
                }}
                className="mt-1"
              />
              <FlexItem flex="1">
                <Metadata separator="-">
                  <MetadataItem className="font-mono text-ui-text">{subtask.key}</MetadataItem>
                  <MetadataItem className="text-ui-text">{subtask.title}</MetadataItem>
                </Metadata>
                {subtask.assignee && (
                  <Typography variant="meta">
                    Assigned to {subtask.assignee.name || subtask.assignee.email || "Unknown"}
                  </Typography>
                )}
              </FlexItem>
            </Flex>
          ))}
        </Flex>
      ) : (
        !isCreatingSubtask && (
          <Typography variant="muted" className="italic">
            No sub-tasks yet
          </Typography>
        )
      )}
    </div>
  );
}
