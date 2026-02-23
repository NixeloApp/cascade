import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Checkbox } from "../ui/form/Checkbox";
import { Input } from "../ui/form/Input";
import { Metadata, MetadataItem } from "../ui/Metadata";
import { Progress } from "../ui/Progress";
import { Stack } from "../ui/Stack";
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

  const createIssue = useMutation(api.issues.createIssue);

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
    <Stack gap="sm">
      <Flex justify="between" align="center">
        <Typography variant="label">
          Sub-tasks
          {totalSubtasks > 0 && (
            <Typography variant="caption" color="tertiary" as="span" className="ml-2">
              ({completedSubtasks}/{totalSubtasks} completed)
            </Typography>
          )}
        </Typography>
        <Button variant="ghost" size="sm" onClick={() => setIsCreatingSubtask(true)}>
          + Add Sub-task
        </Button>
      </Flex>

      {/* Progress bar */}
      {totalSubtasks > 0 && <Progress value={(completedSubtasks / totalSubtasks) * 100} />}

      {/* Create sub-task form */}
      {isCreatingSubtask && (
        <Card padding="sm" variant="flat">
          <Stack gap="sm">
            <Input
              type="text"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Sub-task title..."
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
              <Button size="sm" onClick={handleCreateSubtask}>
                Add
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsCreatingSubtask(false);
                  setSubtaskTitle("");
                }}
              >
                Cancel
              </Button>
            </Flex>
          </Stack>
        </Card>
      )}

      {/* Sub-task list */}
      {subtasks && subtasks.length > 0 ? (
        <Stack gap="xs">
          {subtasks.map((subtask) => (
            <Flex
              key={subtask._id}
              gap="sm"
              align="start"
              className="rounded hover:bg-ui-bg-secondary group"
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
                  <MetadataItem className="font-mono">{subtask.key}</MetadataItem>
                  <MetadataItem>{subtask.title}</MetadataItem>
                </Metadata>
                {subtask.assignee && (
                  <Typography variant="meta">
                    Assigned to {subtask.assignee.name || subtask.assignee.email || "Unknown"}
                  </Typography>
                )}
              </FlexItem>
            </Flex>
          ))}
        </Stack>
      ) : (
        !isCreatingSubtask && (
          <Typography variant="muted" className="italic">
            No sub-tasks yet
          </Typography>
        )
      )}
    </Stack>
  );
}
