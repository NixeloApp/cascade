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
import { memo, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getIssueCardOverlayButtonClassName } from "@/components/ui/buttonSurfaceClassNames";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import {
  getIssueCardAssigneeFallbackClassName,
  getIssueCardDragHandleIconClassName,
  getIssueCardHeaderClassName,
  getIssueCardLabelsClassName,
  getIssueCardRootClassName,
  getIssueCardTitleClassName,
} from "@/components/ui/issueCardSurfaceClassNames";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { type CardDisplayOptions, DEFAULT_CARD_DISPLAY } from "@/lib/card-display-utils";
import type { UserSummary } from "@/lib/entitySummaries";
import { GripVertical } from "@/lib/icons";
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
  assignee?: UserSummary | null;
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

interface IssueCardSectionProps {
  issue: Issue;
  display: CardDisplayOptions;
  canEdit: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  dragHandleRef: React.RefObject<HTMLDivElement | null>;
  handleClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
  handleCheckboxClick: (e: React.SyntheticEvent) => void;
  handleCheckboxCheckedChange: () => void;
}

interface IssueCardFooterProps {
  issue: Issue;
  display: CardDisplayOptions;
  handleClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

interface UseIssueCardDnDArgs {
  issue: Issue;
  status: string;
  canEdit: boolean;
  selectionMode: boolean;
  onDragStateChange?: (isDragging: boolean) => void;
  onIssueDrop?: (
    draggedIssueId: Id<"issues">,
    sourceStatus: string,
    targetIssueId: Id<"issues">,
    targetStatus: string,
    edge: "top" | "bottom",
  ) => void;
}

interface IssueCardInteractionHandlers {
  handleClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

function IssueCardTooltipTrigger({
  children,
  content,
  handleClick,
  testId,
  className,
}: React.PropsWithChildren<
  IssueCardInteractionHandlers & {
    content: string;
    testId?: string;
    className?: string;
  }
>) {
  return (
    <Tooltip content={content}>
      <Flex
        as="span"
        inline
        align="center"
        justify="center"
        onClick={handleClick}
        className={cn("pointer-events-auto cursor-default", className)}
        data-testid={testId}
        aria-hidden="true"
      >
        {children}
      </Flex>
    </Tooltip>
  );
}

function IssueCardAssigneeAvatar({
  assignee,
  handleClick,
}: IssueCardInteractionHandlers & {
  assignee: UserSummary;
}) {
  return (
    <IssueCardTooltipTrigger
      content={`Assigned to: ${assignee.name}`}
      handleClick={handleClick}
      testId={TEST_IDS.ISSUE.ASSIGNEE}
      className="gap-xs"
    >
      {assignee.image ? (
        <Avatar
          name={assignee.name}
          src={assignee.image}
          alt={assignee.name}
          size="xs"
          variant="neutral"
        />
      ) : (
        <Card recipe="issueAssigneeFallback" className={getIssueCardAssigneeFallbackClassName()}>
          {assignee.name.charAt(0).toUpperCase()}
        </Card>
      )}
    </IssueCardTooltipTrigger>
  );
}

function IssueCardLabelBadge({
  className,
  content,
  handleClick,
  children,
  style,
}: React.PropsWithChildren<
  IssueCardInteractionHandlers & {
    className?: string;
    content: string;
    style?: React.CSSProperties;
  }
>) {
  return (
    <IssueCardTooltipTrigger content={content} handleClick={handleClick}>
      <Badge size="sm" className={className} style={style}>
        {children}
      </Badge>
    </IssueCardTooltipTrigger>
  );
}

function IssueCardHeader({
  issue,
  display,
  canEdit,
  selectionMode,
  isSelected,
  dragHandleRef,
  handleClick,
  handleCheckboxClick,
  handleCheckboxCheckedChange,
}: IssueCardSectionProps) {
  return (
    <Flex align="start" justify="between" className={getIssueCardHeaderClassName()}>
      <Flex align="center" gap="xs" className="min-w-0">
        {canEdit && !selectionMode && (
          <div
            ref={dragHandleRef}
            data-testid={TEST_IDS.ISSUE.DRAG_HANDLE}
            className="cursor-grab pointer-events-auto"
          >
            <GripVertical className={getIssueCardDragHandleIconClassName()} aria-hidden="true" />
          </div>
        )}
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
          <IssueCardTooltipTrigger content={getTypeLabel(issue.type)} handleClick={handleClick}>
            <Flex as="span" inline align="center" justify="center">
              <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="sm" className="cursor-help" />
            </Flex>
          </IssueCardTooltipTrigger>
        )}
        <Typography variant="inlineCode" data-testid={TEST_IDS.ISSUE.KEY}>
          {issue.key}
        </Typography>
      </Flex>
      {display.priority && (
        <IssueCardTooltipTrigger
          content={`Priority: ${issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}`}
          handleClick={handleClick}
        >
          <Icon
            icon={PRIORITY_ICONS[issue.priority] ?? PRIORITY_ICONS.medium}
            size="sm"
            data-testid={TEST_IDS.ISSUE.PRIORITY}
            className={cn("cursor-help", getPriorityColor(issue.priority))}
          />
        </IssueCardTooltipTrigger>
      )}
    </Flex>
  );
}

function IssueCardLabels({ issue, display, handleClick }: IssueCardFooterProps) {
  if (!display.labels || issue.labels.length === 0) {
    return null;
  }

  return (
    <Flex wrap gap="xs" className={getIssueCardLabelsClassName()}>
      {issue.labels.slice(0, 3).map((label) => (
        <IssueCardLabelBadge
          key={label.name}
          content={label.description || label.name}
          handleClick={handleClick}
          className="text-brand-foreground cursor-help"
          style={{ backgroundColor: label.color }}
        >
          {label.name}
        </IssueCardLabelBadge>
      ))}
      {issue.labels.length > 3 && (
        <IssueCardLabelBadge
          content={issue.labels
            .slice(3)
            .map((label) => label.name)
            .join(", ")}
          handleClick={handleClick}
          className="cursor-help"
        >
          +{issue.labels.length - 3}
        </IssueCardLabelBadge>
      )}
    </Flex>
  );
}

function IssueCardFooter({ issue, display, handleClick }: IssueCardFooterProps) {
  if (
    (!display.assignee || !issue.assignee) &&
    (!display.storyPoints || issue.storyPoints === undefined)
  ) {
    return null;
  }

  return (
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
          <IssueCardAssigneeAvatar assignee={issue.assignee} handleClick={handleClick} />
        )}
      </Flex>
      {display.storyPoints && issue.storyPoints !== undefined && (
        <Badge variant="neutral" size="sm">
          {issue.storyPoints} pts
        </Badge>
      )}
    </Flex>
  );
}

function useIssueCardDnD({
  issue,
  status,
  canEdit,
  selectionMode,
  onDragStateChange,
  onIssueDrop,
}: UseIssueCardDnDArgs) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const element = cardRef.current;
    const dragHandle = dragHandleRef.current;

    if (!element || !canEdit || selectionMode) {
      return;
    }

    return combine(
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
      dropTargetForElements({
        element,
        canDrop: ({ source }) => {
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
          setClosestEdge(extractClosestEdge(self.data));
        },
        onDrag: ({ self }) => {
          setClosestEdge(extractClosestEdge(self.data));
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
            sourceData.status,
            issue._id,
            status,
            edge,
          );
        },
      }),
    );
  }, [issue._id, issue.order, status, canEdit, selectionMode, onDragStateChange, onIssueDrop]);

  return { cardRef, dragHandleRef, isDragging, closestEdge };
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
  const display = { ...DEFAULT_CARD_DISPLAY, ...displayOptions };
  const { cardRef, dragHandleRef, isDragging, closestEdge } = useIssueCardDnD({
    issue,
    status,
    canEdit,
    selectionMode,
    onDragStateChange,
    onIssueDrop,
  });
  const cardElement = cardRef.current;

  useEffect(() => {
    if (isFocused && cardElement) {
      cardElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused, cardElement]);

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
      className={getIssueCardRootClassName({ isDragging, closestEdge })}
    >
      {/* Primary Action Overlay Button */}
      <Button
        variant="unstyled"
        size="content"
        onClick={handleClick}
        aria-label={getIssueAccessibleLabel(issue)}
        data-testid={TEST_IDS.ISSUE.CARD_TRIGGER(issue.key)}
        className={getIssueCardOverlayButtonClassName()}
      />

      {/* Content Wrapper - pointer-events-none allows clicks to pass through to overlay */}
      <div className="relative z-10 pointer-events-none">
        <IssueCardHeader
          issue={issue}
          display={display}
          canEdit={canEdit}
          selectionMode={selectionMode}
          isSelected={isSelected}
          dragHandleRef={dragHandleRef}
          handleClick={handleClick}
          handleCheckboxClick={handleCheckboxClick}
          handleCheckboxCheckedChange={handleCheckboxCheckedChange}
        />

        {/* Title */}
        <Tooltip content={issue.title}>
          <Typography
            variant="label"
            as="p"
            className={getIssueCardTitleClassName()}
            data-testid={TEST_IDS.ISSUE.TITLE}
            onClick={handleClick}
          >
            {issue.title}
          </Typography>
        </Tooltip>

        <IssueCardLabels issue={issue} display={display} handleClick={handleClick} />

        <IssueCardFooter issue={issue} display={display} handleClick={handleClick} />
      </div>
    </Card>
  );
}, areIssuePropsEqual);
