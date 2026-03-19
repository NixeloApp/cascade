/**
 * Issue Metadata Section
 *
 * Displays issue properties in a structured grid layout.
 * Supports inline editing for status, type, priority, and assignee.
 * Shows labels with colored badges.
 */

import type { Id } from "@convex/_generated/dataModel";
import type { LabelInfo } from "@convex/lib/issueHelpers";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import type { UserSummaryWithOutOfOffice } from "@/lib/entitySummaries";
import { formatOutOfOfficeUntil } from "@/lib/outOfOffice";
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

type ProjectMember = UserSummaryWithOutOfOffice;

interface WorkflowState {
  id: string;
  name: string;
  category: string;
}

interface IssueMetadataProps {
  status: string;
  type: IssueTypeWithSubtask;
  priority: IssuePriority;
  assignee?: UserSummaryWithOutOfOffice | null;
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

function renderStatusContent(
  status: string,
  statusName: string,
  workflowStates: WorkflowState[],
  onStatusChange?: (status: string) => void,
) {
  if (!onStatusChange) {
    return <Typography variant="label">{statusName}</Typography>;
  }

  return (
    <InlineStatusSelect value={status} workflowStates={workflowStates} onChange={onStatusChange} />
  );
}

function renderTypeContent(
  type: IssueTypeWithSubtask,
  onTypeChange?: (type: IssueTypeWithSubtask) => void,
) {
  if (!onTypeChange) {
    return (
      <Typography variant="label" className="capitalize">
        {type}
      </Typography>
    );
  }

  return <InlineTypeSelect value={type} onChange={onTypeChange} />;
}

function renderPriorityContent(
  priority: IssuePriority,
  onPriorityChange?: (priority: IssuePriority) => void,
) {
  if (!onPriorityChange) {
    return (
      <Typography variant="label" className="capitalize">
        {priority}
      </Typography>
    );
  }

  return <InlinePrioritySelect value={priority} onChange={onPriorityChange} />;
}

function renderAssigneeContent(
  assignee: IssueMetadataProps["assignee"],
  members: ProjectMember[],
  onAssigneeChange?: (assigneeId: Id<"users"> | null) => void,
) {
  if (!onAssigneeChange) {
    if (!assignee) {
      return <Typography variant="label">Unassigned</Typography>;
    }

    return (
      <Stack gap="xs">
        <Flex align="center" gap="sm">
          <Typography variant="label">{assignee.name}</Typography>
          {assignee.outOfOffice ? <Badge variant="warning">OOO</Badge> : null}
        </Flex>
        {assignee.outOfOffice ? (
          <Typography variant="small" color="secondary">
            {formatOutOfOfficeUntil(assignee.outOfOffice)}
          </Typography>
        ) : null}
      </Stack>
    );
  }

  return (
    <InlineAssigneeSelect value={assignee?._id} members={members} onChange={onAssigneeChange} />
  );
}

function renderStoryPointsContent(
  storyPoints: number | null | undefined,
  onStoryPointsChange?: (storyPoints: number | null) => void,
) {
  if (!onStoryPointsChange) {
    return <Typography variant="label">{storyPoints ?? "Not set"}</Typography>;
  }

  return <InlineStoryPointsInput value={storyPoints} onChange={onStoryPointsChange} />;
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
          <PropertyRow label="Status">
            {renderStatusContent(
              status,
              statusName,
              workflowStates,
              canEditStatus ? onStatusChange : undefined,
            )}
          </PropertyRow>

          <PropertyRow label="Type">
            {renderTypeContent(type, canEditType ? onTypeChange : undefined)}
          </PropertyRow>

          <PropertyRow label="Priority">
            {renderPriorityContent(priority, canEditPriority ? onPriorityChange : undefined)}
          </PropertyRow>

          <PropertyRow label="Assignee">
            {renderAssigneeContent(
              assignee,
              members,
              canEditAssignee ? onAssigneeChange : undefined,
            )}
          </PropertyRow>

          <PropertyRow label="Reporter">
            <Typography variant="label">{reporter?.name || "Unknown"}</Typography>
          </PropertyRow>

          <PropertyRow label="Story Points">
            {renderStoryPointsContent(
              storyPoints,
              canEditStoryPoints ? onStoryPointsChange : undefined,
            )}
          </PropertyRow>
        </Stack>
      </Card>

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
                className="text-brand-foreground"
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
