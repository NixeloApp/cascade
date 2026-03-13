/**
 * Issue Card
 *
 * Draggable card component for displaying issues on Kanban boards.
 * Shows key, title, type, priority, assignee, and labels.
 * Supports drag-and-drop with drop indicators and keyboard navigation.
 */

import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Id } from "@convex/_generated/dataModel";
import { GripVertical } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { type CardDisplayOptions, DEFAULT_CARD_DISPLAY } from "@/lib/card-display-utils";
import type { IssuePriority, IssueType } from "@/lib/issue-utils";
import {
  getIssueAccessibleLabel,
  getPriorityColor,
  getTypeLabel,
  ISSUE_TYPE_ICONS,
  PRIORITY_ICONS,
} from "@/lib/issue-utils";
import { createIssueCardData, isIssueCardData } from "@/lib/kanban-dnd";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";

interface Issue {
  _id: Id<"issues">;
  key: string;
  title: string;
  type: IssueType;
  priority: IssuePriority;
  order: number;
  assignee?: {
    _id: Id<"users">;
    name: string;
    image?: string;
  } | null;
  labels: { name: string; color: string; description?: string }[];
  storyPoints?: number;
  updatedAt: number;
}

interface IssueCardProps {
  issue: Issue;
  /** Status of the issue (for DnD payload) */
  status: string;
  onClick?: (issueId: Id<"issues">) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  isFocused?: boolean;
  onToggleSelect?: (issueId: Id<"issues">) => void;
  canEdit?: boolean;
  /** Callback when drag starts (for parent state management) */
  onDragStateChange?: (isDragging: boolean) => void;
  /** Callback when an issue is dropped on this card */
  onIssueDrop?: (
    draggedIssueId: Id<"issues">,
    sourceStatus: string,
    targetIssueId: Id<"issues">,
    targetStatus: string,
    edge: "top" | "bottom",
  ) => void;
  /** Card display options to show/hide properties */
  displayOptions?: CardDisplayOptions;
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
    prev.canEdit !== next.canEdit ||
    prev.status !== next.status
  ) {
    return false;
  }

  // Check callback props to prevent stale closures
  if (
    prev.onClick !== next.onClick ||
    prev.onToggleSelect !== next.onToggleSelect ||
    prev.onDragStateChange !== next.onDragStateChange ||
    prev.onIssueDrop !== next.onIssueDrop
  ) {
    return false;
  }

  // Check displayOptions (shallow comparison)
  const prevOpts = prev.displayOptions;
  const nextOpts = next.displayOptions;
  if (prevOpts !== nextOpts) {
    if (!prevOpts || !nextOpts) return false;
    if (
      prevOpts.assignee !== nextOpts.assignee ||
      prevOpts.priority !== nextOpts.priority ||
      prevOpts.labels !== nextOpts.labels ||
      prevOpts.storyPoints !== nextOpts.storyPoints ||
      prevOpts.issueType !== nextOpts.issueType
    ) {
      return false;
    }
  }

  // Check issue object equality
  return areIssuesEqual(prev.issue, next.issue);
}

export function areIssuesEqual(prevIssue: Issue, nextIssue: Issue) {
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

  return true;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Card component with drag-drop, selection, and conditional display logic
export const IssueCard = memo(function IssueCard({
  issue,
  status,
  onClick,
  selectionMode = false,
  isSelected = false,
  isFocused = false,
  onToggleSelect,
  canEdit = true,
  onDragStateChange,
  onIssueDrop,
  displayOptions = DEFAULT_CARD_DISPLAY,
}: IssueCardProps) {
  // Merge with defaults to ensure all properties are defined
  const display = { ...DEFAULT_CARD_DISPLAY, ...displayOptions };
  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  // Scroll into view when focused
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused]);

  // Set up Pragmatic DnD draggable + drop target
  useEffect(() => {
    const element = cardRef.current;
    const dragHandle = dragHandleRef.current;

    if (!element || !canEdit || selectionMode) {
      return;
    }

    return combine(
      // Make the card draggable
      draggable({
        element,
        dragHandle: dragHandle ?? undefined,
        getInitialData: () => createIssueCardData(issue._id, status, issue.order),
        onDragStart: () => {
          setIsDragging(true);
          onDragStateChange?.(true);
        },
        onDrop: () => {
          setIsDragging(false);
          onDragStateChange?.(false);
        },
      }),
      // Make the card a drop target for reordering
      dropTargetForElements({
        element,
        canDrop: ({ source }) => {
          // Only accept other issue cards (not self)
          const data = source.data as Record<string, unknown>;
          return isIssueCardData(data) && data.issueId !== issue._id;
        },
        getData: ({ input }) =>
          attachClosestEdge(createIssueCardData(issue._id, status, issue.order), {
            element,
            input,
            allowedEdges: ["top", "bottom"],
          }),
        onDragEnter: ({ self }) => {
          const edge = extractClosestEdge(self.data);
          setClosestEdge(edge);
        },
        onDrag: ({ self }) => {
          const edge = extractClosestEdge(self.data);
          setClosestEdge(edge);
        },
        onDragLeave: () => {
          setClosestEdge(null);
        },
        onDrop: ({ source, self }) => {
          setClosestEdge(null);
          const sourceData = source.data as Record<string, unknown>;
          if (!isIssueCardData(sourceData)) return;

          const edge = extractClosestEdge(self.data);
          if (!edge || (edge !== "top" && edge !== "bottom")) return;

          onIssueDrop?.(
            sourceData.issueId as Id<"issues">,
            sourceData.status as string,
            issue._id,
            status,
            edge,
          );
        },
      }),
    );
  }, [issue._id, issue.order, status, canEdit, selectionMode, onDragStateChange, onIssueDrop]);

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
  };

  const handleCheckboxCheckedChange = () => {
    onToggleSelect?.(issue._id);
  };

  const issueCardRecipe = isSelected
    ? "issueCardSelected"
    : isFocused
      ? "issueCardFocused"
      : "issueCard";

  return (
    <Card
      ref={cardRef}
      data-testid={TEST_IDS.ISSUE.CARD}
      recipe={issueCardRecipe}
      className={cn(
        "group relative w-full text-left",
        isDragging && "opacity-50 scale-95",
        // Drop indicator edges
        closestEdge === "top" &&
          "before:absolute before:left-0 before:right-0 before:-top-1 before:h-0.5 before:bg-brand before:rounded-full",
        closestEdge === "bottom" &&
          "after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:bg-brand after:rounded-full",
      )}
    >
      {/* Primary Action Overlay Button */}
      <Button variant="overlay" onClick={handleClick} aria-label={getIssueAccessibleLabel(issue)} />

      {/* Content Wrapper - pointer-events-none allows clicks to pass through to overlay */}
      <div className="relative z-10 pointer-events-none">
        {/* Header */}
        <Flex align="start" justify="between" className="mb-1 sm:mb-2">
          <Flex align="center" gap="xs" className="min-w-0">
            {/* Drag handle */}
            {canEdit && !selectionMode && (
              <div
                ref={dragHandleRef}
                data-testid={TEST_IDS.ISSUE.DRAG_HANDLE}
                className="cursor-grab pointer-events-auto"
              >
                <GripVertical
                  className="h-3 w-3 shrink-0 -ml-0.5 text-ui-text-tertiary opacity-40"
                  aria-hidden="true"
                />
              </div>
            )}
            {/* Checkbox */}
            {selectionMode && (
              <Checkbox
                aria-label={`Select issue ${issue.key}`}
                checked={isSelected}
                onClick={handleCheckboxClick}
                onCheckedChange={handleCheckboxCheckedChange}
                className="pointer-events-auto"
              />
            )}
            {display.issueType && (
              <Tooltip content={getTypeLabel(issue.type)}>
                {/* Tooltip trigger needs pointer events */}
                <Flex
                  as="span"
                  inline
                  align="center"
                  justify="center"
                  onClick={handleClick}
                  className="pointer-events-auto cursor-default"
                  aria-hidden="true"
                >
                  <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="sm" className="cursor-help" />
                </Flex>
              </Tooltip>
            )}
            <Typography variant="inlineCode" data-testid={TEST_IDS.ISSUE.KEY}>
              {issue.key}
            </Typography>
          </Flex>
          {display.priority && (
            <Tooltip
              content={`Priority: ${issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}`}
            >
              <Flex
                as="span"
                inline
                align="center"
                justify="center"
                onClick={handleClick}
                className="pointer-events-auto cursor-default"
                aria-hidden="true"
              >
                <Icon
                  icon={PRIORITY_ICONS[issue.priority] ?? PRIORITY_ICONS.medium}
                  size="sm"
                  data-testid={TEST_IDS.ISSUE.PRIORITY}
                  className={cn("cursor-help", getPriorityColor(issue.priority))}
                />
              </Flex>
            </Tooltip>
          )}
        </Flex>

        {/* Title */}
        <Tooltip content={issue.title}>
          <Typography
            variant="label"
            as="p"
            className="mb-1 line-clamp-2 pointer-events-auto leading-snug sm:mb-2"
            data-testid={TEST_IDS.ISSUE.TITLE}
            onClick={handleClick}
          >
            {issue.title}
          </Typography>
        </Tooltip>

        {/* Labels */}
        {display.labels && issue.labels.length > 0 && (
          <Flex wrap gap="xs" className="mb-1.5 sm:mb-2">
            {issue.labels.slice(0, 3).map((label) => (
              <Tooltip key={label.name} content={label.description || label.name}>
                <Flex
                  as="span"
                  inline
                  align="center"
                  justify="center"
                  onClick={handleClick}
                  className="pointer-events-auto cursor-default"
                  aria-hidden="true"
                >
                  <Badge
                    size="sm"
                    className="text-brand-foreground cursor-help"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </Badge>
                </Flex>
              </Tooltip>
            ))}
            {issue.labels.length > 3 && (
              <Tooltip
                content={issue.labels
                  .slice(3)
                  .map((l) => l.name)
                  .join(", ")}
              >
                <Flex
                  as="span"
                  inline
                  align="center"
                  justify="center"
                  onClick={handleClick}
                  className="pointer-events-auto cursor-default"
                  aria-hidden="true"
                >
                  <Badge variant="neutral" size="sm" className="cursor-help">
                    +{issue.labels.length - 3}
                  </Badge>
                </Flex>
              </Tooltip>
            )}
          </Flex>
        )}

        {/* Footer - only show if assignee or story points are visible and have values */}
        {((display.assignee && issue.assignee) ||
          (display.storyPoints && issue.storyPoints !== undefined)) && (
          <Flex
            direction="column"
            directionSm="row"
            align="start"
            alignSm="center"
            justify="between"
            gap="xs"
          >
            <Flex align="center" gap="xs">
              {display.assignee && issue.assignee && (
                <Tooltip content={`Assigned to: ${issue.assignee.name}`}>
                  <Flex
                    as="span"
                    inline
                    align="center"
                    justify="center"
                    gap="xs"
                    onClick={handleClick}
                    className="pointer-events-auto cursor-default"
                    data-testid={TEST_IDS.ISSUE.ASSIGNEE}
                    aria-hidden="true"
                  >
                    {issue.assignee.image ? (
                      <Avatar
                        name={issue.assignee.name}
                        src={issue.assignee.image}
                        alt={issue.assignee.name}
                        size="xs"
                        variant="neutral"
                      />
                    ) : (
                      <Card
                        recipe="issueAssigneeFallback"
                        className="inline-flex size-5 items-center justify-center text-xs font-medium"
                      >
                        {issue.assignee.name.charAt(0).toUpperCase()}
                      </Card>
                    )}
                  </Flex>
                </Tooltip>
              )}
            </Flex>
            {display.storyPoints && issue.storyPoints !== undefined && (
              <Badge variant="neutral" size="sm">
                {issue.storyPoints} pts
              </Badge>
            )}
          </Flex>
        )}
      </div>
    </Card>
  );
}, areIssuePropsEqual);
