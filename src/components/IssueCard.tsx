import type { Id } from "@convex/_generated/dataModel";
import { GripVertical } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import type { IssuePriority, IssueType } from "@/lib/issue-utils";
import {
  getPriorityColor,
  getTypeLabel,
  ISSUE_TYPE_ICONS,
  PRIORITY_ICONS,
} from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Icon } from "./ui/Icon";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

interface Issue {
  _id: Id<"issues">;
  key: string;
  title: string;
  type: IssueType;
  priority: IssuePriority;
  assignee?: {
    _id: Id<"users">;
    name: string;
    image?: string;
  } | null;
  labels: { name: string; color: string }[];
  storyPoints?: number;
  updatedAt: number;
}

interface IssueCardProps {
  issue: Issue;
  onDragStart: (e: React.DragEvent, issueId: Id<"issues">) => void;
  onClick?: (issueId: Id<"issues">) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  isFocused?: boolean;
  onToggleSelect?: (issueId: Id<"issues">) => void;
  canEdit?: boolean;
}

/**
 * Custom equality check for IssueCard
 * Optimizes performance by avoiding re-renders when issue data hasn't effectively changed,
 * even if the object reference is new (common with Convex queries).
 */
function areIssuePropsEqual(prev: IssueCardProps, next: IssueCardProps) {
  // Check primitive props
  if (
    prev.isSelected !== next.isSelected ||
    prev.isFocused !== next.isFocused ||
    prev.selectionMode !== next.selectionMode ||
    prev.canEdit !== next.canEdit
  ) {
    return false;
  }

  // Check callback props to prevent stale closures
  if (
    prev.onDragStart !== next.onDragStart ||
    prev.onClick !== next.onClick ||
    prev.onToggleSelect !== next.onToggleSelect
  ) {
    return false;
  }

  // Check issue object equality
  const prevIssue = prev.issue;
  const nextIssue = next.issue;

  // Reference equality check (fastest)
  if (prevIssue === nextIssue) return true;

  // ID and modification time check (fast)
  if (prevIssue._id !== nextIssue._id) return false;
  if (prevIssue.updatedAt !== nextIssue.updatedAt) return false;

  // Check enriched fields that might change without issue modification time updating
  // Assignee details
  if (prevIssue.assignee?._id !== nextIssue.assignee?._id) return false;
  if (prevIssue.assignee?.name !== nextIssue.assignee?.name) return false;
  if (prevIssue.assignee?.image !== nextIssue.assignee?.image) return false;

  // Label details
  if (prevIssue.labels.length !== nextIssue.labels.length) return false;
  for (let i = 0; i < prevIssue.labels.length; i++) {
    const prevLabel = prevIssue.labels[i];
    const nextLabel = nextIssue.labels[i];
    if (prevLabel.name !== nextLabel.name) return false;
    if (prevLabel.color !== nextLabel.color) return false;
  }

  // If we got here, important fields are effectively equal
  return true;
}

export const IssueCard = memo(function IssueCard({
  issue,
  onDragStart,
  onClick,
  selectionMode = false,
  isSelected = false,
  isFocused = false,
  onToggleSelect,
  canEdit = true,
}: IssueCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused]);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(e, issue._id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (selectionMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect(issue._id);
    } else if (onClick) {
      onClick(issue._id);
    }
  };

  const handleCheckboxClick = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(issue._id);
    }
  };

  return (
    <div
      ref={cardRef}
      role="article"
      data-testid={TEST_IDS.ISSUE.CARD}
      draggable={canEdit && !selectionMode}
      onDragStart={canEdit && !selectionMode ? handleDragStart : undefined}
      onDragEnd={handleDragEnd}
      className={cn(
        "group relative w-full text-left bg-ui-bg-soft p-2 sm:p-3 rounded-container",
        "border transition-default",
        // Apply focus ring to container when inner elements (like the overlay button) are focused
        "focus-within:ring-2 focus-within:ring-brand-ring focus-within:ring-offset-2 focus-within:outline-none",
        isDragging && "opacity-50 scale-95",
        isSelected
          ? "border-brand-indigo-border/60 bg-brand-indigo-track shadow-soft"
          : isFocused
            ? "border-ui-border-focus/50 ring-1 ring-ui-border-focus/20 bg-ui-bg-hover"
            : "border-ui-border hover:border-ui-border-secondary hover:bg-ui-bg-hover",
      )}
    >
      {/* Primary Action Overlay Button */}
      <button
        type="button"
        onClick={handleClick}
        className="absolute inset-0 w-full h-full z-0 opacity-0 cursor-pointer focus:outline-none"
        aria-label={`Open issue ${issue.key}: ${issue.title}`}
      />

      {/* Content Wrapper - pointer-events-none allows clicks to pass through to overlay */}
      <div className="relative z-10 pointer-events-none">
        {/* Header */}
        <Flex align="start" justify="between" className="mb-2">
          <Flex align="center" className="space-x-2">
            {/* Drag handle */}
            {canEdit && !selectionMode && (
              <GripVertical
                className="w-3 h-3 text-ui-text-tertiary opacity-0 group-hover:opacity-40 transition-fast cursor-grab -ml-0.5 shrink-0 pointer-events-auto"
                aria-hidden="true"
              />
            )}
            {/* Checkbox */}
            {selectionMode && (
              <input
                type="checkbox"
                aria-label={`Select issue ${issue.key}`}
                checked={isSelected}
                onChange={handleCheckboxClick}
                onClick={handleCheckboxClick}
                className="w-4 h-4 text-brand border-ui-border rounded focus:ring-brand-ring cursor-pointer pointer-events-auto"
              />
            )}
            <Tooltip content={getTypeLabel(issue.type)}>
              {/* Tooltip trigger needs pointer events */}
              <div className="pointer-events-auto">
                <Icon
                  icon={ISSUE_TYPE_ICONS[issue.type]}
                  size="sm"
                  className="cursor-help"
                  role="img"
                  aria-label={getTypeLabel(issue.type)}
                />
              </div>
            </Tooltip>
            <code data-testid={TEST_IDS.ISSUE.KEY} className="font-mono text-xs">
              {issue.key}
            </code>
          </Flex>
          <Tooltip
            content={`Priority: ${issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}`}
          >
            <div className="pointer-events-auto">
              <Icon
                icon={PRIORITY_ICONS[issue.priority] ?? PRIORITY_ICONS.medium}
                size="sm"
                data-testid={TEST_IDS.ISSUE.PRIORITY}
                aria-label={`Priority: ${issue.priority}`}
                role="img"
                className={cn("cursor-help", getPriorityColor(issue.priority))}
              />
            </div>
          </Tooltip>
        </Flex>

        {/* Title */}
        <Typography
          variant="label"
          as="p"
          className="text-xs sm:text-sm mb-2 line-clamp-2"
          data-testid={TEST_IDS.ISSUE.TITLE}
        >
          {issue.title}
        </Typography>

        {/* Labels */}
        {issue.labels.length > 0 && (
          <Flex wrap gap="xs" className="mb-2">
            {issue.labels.slice(0, 3).map((label) => (
              <Badge
                key={label.name}
                size="sm"
                className="text-brand-foreground"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </Badge>
            ))}
            {issue.labels.length > 3 && (
              <Tooltip
                content={issue.labels
                  .slice(3)
                  .map((l) => l.name)
                  .join(", ")}
              >
                <span
                  tabIndex={0}
                  role="button"
                  className="rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-ring pointer-events-auto"
                >
                  <Typography variant="caption" className="px-1.5 py-0.5 cursor-help">
                    +{issue.labels.length - 3}
                  </Typography>
                </span>
              </Tooltip>
            )}
          </Flex>
        )}

        {/* Footer */}
        <Flex
          direction="column"
          align="start"
          justify="between"
          gap="sm"
          className="sm:flex-row sm:items-center"
        >
          <Flex align="center" className="space-x-2">
            {issue.assignee && (
              <Tooltip content={`Assigned to: ${issue.assignee.name}`}>
                <Flex align="center" className="space-x-1 pointer-events-auto">
                  {issue.assignee.image ? (
                    <img
                      src={issue.assignee.image}
                      alt={issue.assignee.name}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <Flex
                      align="center"
                      justify="center"
                      className="w-5 h-5 rounded-full bg-ui-bg-tertiary text-xs text-ui-text-secondary"
                    >
                      {issue.assignee.name.charAt(0).toUpperCase()}
                    </Flex>
                  )}
                </Flex>
              </Tooltip>
            )}
          </Flex>
          {issue.storyPoints !== undefined && (
            <Badge variant="neutral" size="sm">
              {issue.storyPoints} pts
            </Badge>
          )}
        </Flex>
      </div>
    </div>
  );
}, areIssuePropsEqual);
