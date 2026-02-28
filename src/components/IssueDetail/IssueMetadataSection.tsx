import type { Id } from "@convex/_generated/dataModel";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import type { LabelInfo } from "../../../convex/lib/issueHelpers";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import {
  InlineAssigneeSelect,
  InlinePrioritySelect,
  InlineStatusSelect,
  InlineStoryPointsInput,
  InlineTypeSelect,
  PropertyRow,
} from "./InlinePropertyEdit";

interface ProjectMember {
  _id: Id<"users">;
  name: string;
  image?: string;
}

interface WorkflowState {
  id: string;
  name: string;
  category: string;
}

interface IssueMetadataProps {
  status: string;
  type: string;
  priority: IssuePriority;
  assignee?: { _id: string; name: string; image?: string } | null;
  reporter?: { name: string } | null;
  storyPoints?: number | null;
  labels: LabelInfo[];
  /** Enable inline editing (requires project data) */
  editable?: boolean;
  /** Project members for assignee dropdown */
  members?: ProjectMember[];
  /** Workflow states for status dropdown */
  workflowStates?: WorkflowState[];
  /** Callbacks for property updates */
  onStatusChange?: (status: string) => void;
  onTypeChange?: (type: IssueTypeWithSubtask) => void;
  onPriorityChange?: (priority: IssuePriority) => void;
  onAssigneeChange?: (assigneeId: Id<"users"> | null) => void;
  onStoryPointsChange?: (storyPoints: number | null) => void;
}

/**
 * Displays issue metadata grid and labels with optional inline editing
 * Extracted from IssueDetailModal for better organization
 */
export function IssueMetadataSection({
  status,
  type,
  priority,
  assignee,
  reporter,
  storyPoints,
  labels,
  editable = false,
  members = [],
  workflowStates = [],
  onStatusChange,
  onTypeChange,
  onPriorityChange,
  onAssigneeChange,
  onStoryPointsChange,
}: IssueMetadataProps) {
  const canEditStatus = editable && workflowStates.length > 0 && onStatusChange;
  const canEditType = editable && onTypeChange;
  const canEditPriority = editable && onPriorityChange;
  const canEditAssignee = editable && members.length > 0 && onAssigneeChange;
  const canEditStoryPoints = editable && onStoryPointsChange;

  // Find current status name from workflow states
  const statusName = workflowStates.find((s) => s.id === status)?.name || status;

  return (
    <Stack gap="md">
      {/* Metadata with inline editing */}
      <Card padding="md" variant="flat" className="border-ui-border/30">
        <Stack gap="xs">
          {/* Status */}
          <PropertyRow label="Status">
            {canEditStatus ? (
              <InlineStatusSelect
                value={status}
                workflowStates={workflowStates}
                onChange={onStatusChange}
              />
            ) : (
              <Typography variant="label">{statusName}</Typography>
            )}
          </PropertyRow>

          {/* Type */}
          <PropertyRow label="Type">
            {canEditType ? (
              <InlineTypeSelect value={type as IssueTypeWithSubtask} onChange={onTypeChange} />
            ) : (
              <Typography variant="label" className="capitalize">
                {type}
              </Typography>
            )}
          </PropertyRow>

          {/* Priority */}
          <PropertyRow label="Priority">
            {canEditPriority ? (
              <InlinePrioritySelect value={priority} onChange={onPriorityChange} />
            ) : (
              <Typography variant="label" className="capitalize">
                {priority}
              </Typography>
            )}
          </PropertyRow>

          {/* Assignee */}
          <PropertyRow label="Assignee">
            {canEditAssignee ? (
              <InlineAssigneeSelect
                value={assignee?._id}
                members={members}
                onChange={onAssigneeChange}
              />
            ) : (
              <Typography variant="label">{assignee?.name || "Unassigned"}</Typography>
            )}
          </PropertyRow>

          {/* Reporter (read-only) */}
          <PropertyRow label="Reporter">
            <Typography variant="label">{reporter?.name || "Unknown"}</Typography>
          </PropertyRow>

          {/* Story Points */}
          <PropertyRow label="Story Points">
            {canEditStoryPoints ? (
              <InlineStoryPointsInput value={storyPoints} onChange={onStoryPointsChange} />
            ) : (
              <Typography variant="label">{storyPoints ?? "Not set"}</Typography>
            )}
          </PropertyRow>
        </Stack>
      </Card>

      {/* Labels */}
      {labels.length > 0 && (
        <Stack gap="sm">
          <Typography variant="meta" color="secondary">
            Labels
          </Typography>
          <Flex wrap gap="sm">
            {labels.map((label) => (
              <Badge
                key={label.name}
                size="sm"
                className="text-brand-foreground transition-transform duration-default hover:scale-105"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </Badge>
            ))}
          </Flex>
        </Stack>
      )}
    </Stack>
  );
}
