/**
 * SpreadsheetRow - Single row in the spreadsheet view
 *
 * Features:
 * - Inline editing for all editable properties
 * - Click to select or open issue detail
 * - Hover state with actions
 */

import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import type { WorkflowState } from "@convex/shared/types";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import type { IssuePriority, IssueType } from "@/lib/issue-utils";
import { getTypeLabel, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import {
  AssigneeCell,
  DateCell,
  LabelsCell,
  PriorityCell,
  StatusCell,
  StoryPointsCell,
  TypeCell,
} from "./cells";
import type { ColumnDefinition } from "./SpreadsheetView";

interface SpreadsheetRowProps {
  issue: EnrichedIssue;
  columns: ColumnDefinition[];
  workflowStates: WorkflowState[];
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (issueId: Id<"issues">) => void;
  onIssueClick: (issueId: Id<"issues">) => void;
  onUpdateIssue: (issueId: Id<"issues">, data: Partial<EnrichedIssue>) => Promise<void>;
  canEdit: boolean;
}

/** Render the appropriate cell component for a column */
function CellContent({
  column,
  issue,
  workflowStates,
  canEdit,
  onUpdateIssue,
}: {
  column: ColumnDefinition;
  issue: EnrichedIssue;
  workflowStates: WorkflowState[];
  canEdit: boolean;
  onUpdateIssue: (issueId: Id<"issues">, data: Partial<EnrichedIssue>) => Promise<void>;
}) {
  switch (column.id) {
    case "key":
      return (
        <Typography variant="inlineCode" className="text-xs">
          {issue.key}
        </Typography>
      );

    case "type":
      return (
        <TypeCell
          type={issue.type as IssueType}
          onUpdate={canEdit ? (type) => onUpdateIssue(issue._id, { type }) : undefined}
        />
      );

    case "priority":
      return (
        <PriorityCell
          priority={issue.priority as IssuePriority}
          onUpdate={canEdit ? (priority) => onUpdateIssue(issue._id, { priority }) : undefined}
        />
      );

    case "status":
      return (
        <StatusCell
          status={issue.status}
          workflowStates={workflowStates}
          onUpdate={canEdit ? (status) => onUpdateIssue(issue._id, { status }) : undefined}
        />
      );

    case "assignee":
      return (
        <AssigneeCell
          assignee={issue.assignee}
          projectId={issue.projectId}
          onUpdate={
            canEdit
              ? (assigneeId) => onUpdateIssue(issue._id, { assigneeId: assigneeId ?? undefined })
              : undefined
          }
        />
      );

    case "labels":
      return <LabelsCell labels={issue.labels} />;

    case "storyPoints":
      return (
        <StoryPointsCell
          points={issue.storyPoints}
          onUpdate={
            canEdit ? (storyPoints) => onUpdateIssue(issue._id, { storyPoints }) : undefined
          }
        />
      );

    case "dueDate":
      return (
        <DateCell
          date={issue.dueDate}
          onUpdate={canEdit ? (dueDate) => onUpdateIssue(issue._id, { dueDate }) : undefined}
        />
      );

    case "startDate":
      return (
        <DateCell
          date={issue.startDate}
          onUpdate={canEdit ? (startDate) => onUpdateIssue(issue._id, { startDate }) : undefined}
        />
      );

    case "createdAt":
      return (
        <Typography variant="meta" color="secondary">
          {new Date(issue._creationTime).toLocaleDateString()}
        </Typography>
      );

    case "updatedAt":
      return (
        <Typography variant="meta" color="secondary">
          {new Date(issue.updatedAt).toLocaleDateString()}
        </Typography>
      );

    default:
      return null;
  }
}

export function SpreadsheetRow({
  issue,
  columns,
  workflowStates,
  selectionMode,
  isSelected,
  onToggleSelect,
  onIssueClick,
  onUpdateIssue,
  canEdit,
}: SpreadsheetRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleRowClick = () => {
    if (selectionMode) {
      onToggleSelect(issue._id);
    } else {
      onIssueClick(issue._id);
    }
  };

  // Event handler to stop propagation without keyboard equivalent
  const stopPropagation = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <tr
      data-testid={TEST_IDS.ISSUE.CARD}
      className={cn(
        "group border-b border-ui-border transition-colors cursor-pointer",
        isSelected ? "bg-brand-indigo-bg/30 hover:bg-brand-indigo-bg/50" : "hover:bg-ui-bg-hover",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRowClick}
    >
      {/* Title column (sticky) */}
      <td className="sticky left-0 z-10 bg-inherit border-r border-ui-border min-w-80 group-hover:bg-ui-bg-hover">
        <Flex align="center" gap="sm" className="h-11 px-3">
          {/* Checkbox for selection */}
          <FlexItem shrink={false} className="w-5">
            {selectionMode ? (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(issue._id)}
                onClick={stopPropagation}
                aria-label={`Select ${issue.key}`}
              />
            ) : (
              isHovered && (
                <Checkbox
                  checked={false}
                  onCheckedChange={() => onToggleSelect(issue._id)}
                  onClick={stopPropagation}
                  aria-label={`Select ${issue.key}`}
                  className="opacity-50 hover:opacity-100"
                />
              )
            )}
          </FlexItem>

          {/* Issue type icon */}
          <Tooltip content={getTypeLabel(issue.type)}>
            <Icon
              icon={ISSUE_TYPE_ICONS[issue.type as IssueType]}
              size="sm"
              className="shrink-0"
              aria-label={getTypeLabel(issue.type)}
            />
          </Tooltip>

          {/* Title */}
          <Typography
            variant="label"
            className="truncate flex-1"
            data-testid={TEST_IDS.ISSUE.TITLE}
          >
            {issue.title}
          </Typography>

          {/* Quick actions */}
          <div
            className={cn("shrink-0 transition-opacity", isHovered ? "opacity-100" : "opacity-0")}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={stopPropagation}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onIssueClick(issue._id)}>
                  Open details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(issue.key)}>
                  Copy key
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Flex>
      </td>

      {/* Property columns */}
      {columns.map((column) => (
        <td
          key={column.id}
          className={cn("h-11 px-3 border-r border-ui-border/50 last:border-r-0", column.width)}
        >
          <CellContent
            column={column}
            issue={issue}
            workflowStates={workflowStates}
            canEdit={canEdit}
            onUpdateIssue={onUpdateIssue}
          />
        </td>
      ))}

      {/* Empty settings column */}
      <td className="w-10" />
    </tr>
  );
}
