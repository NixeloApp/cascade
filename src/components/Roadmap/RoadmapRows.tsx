/**
 * Row-level display components for the Roadmap timeline.
 * Timeline bars, group headers, issue identity, summary bars, and issue rows.
 */

import type { Id } from "@convex/_generated/dataModel";
import { ChevronDown, ChevronRight } from "@/lib/icons";
import {
  getPriorityBadgeTone,
  getPriorityColor,
  getStatusBadgeTone,
  ISSUE_TYPE_ICONS,
} from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, getCardRecipeClassName } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { Progress } from "../ui/Progress";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import type {
  GroupBy,
  RoadmapBarIssue,
  RoadmapGroupRowProps,
  RoadmapIssue,
  RoadmapIssueIdentityProps,
  RoadmapIssueRowProps,
  RoadmapSummaryBarProps,
  RoadmapTimelineBarProps,
  TimelineGroup,
  TimelineSpan,
} from "./types";
import {
  getBarLeft,
  getBarWidth,
  getPriorityLabel,
  getRoadmapBarTitle,
  getRoadmapDateBadgeLabel,
  getRoadmapStatusLabel,
  getRoadmapSubtaskCaption,
  getStickyGroupColumnClassName,
  getStickyIssueColumnClassName,
  getSummaryCompletionLabel,
  getSummaryCompletionPercentage,
  getTimelineGroupBadgeTone,
  getTimelineGroupLabel,
  isRoadmapMilestone,
  shouldRenderEpicSummaryBar,
} from "./utils";

export function RoadmapTimelineBar({
  canEdit,
  draggingIssueId,
  getPositionOnTimeline,
  issue,
  onBarDragStart,
  onOpenIssue,
  onResizeStart,
  resizingIssueId,
}: RoadmapTimelineBarProps) {
  if (!issue.dueDate) {
    return null;
  }

  const isActive = resizingIssueId === issue._id || draggingIssueId === issue._id;
  const isMilestone = isRoadmapMilestone(issue);
  const left = getBarLeft(issue.startDate, issue.dueDate, getPositionOnTimeline);
  const width = getBarWidth(issue.startDate, issue.dueDate, getPositionOnTimeline);

  if (isMilestone) {
    return (
      <div
        className="absolute h-roadmap-bar"
        style={{
          left: `${left}%`,
          width: `${width}%`,
        }}
      >
        <Button
          chrome="roadmapTimelineHitArea"
          chromeSize="roadmapTimelineFill"
          data-testid={`roadmap-milestone-${issue._id}`}
          onMouseDown={(e) => onBarDragStart(e, issue._id, issue.startDate, issue.dueDate)}
          onClick={() => onOpenIssue(issue._id)}
          title={getRoadmapBarTitle(issue, canEdit)}
          aria-label={`View milestone ${issue.key}`}
        >
          <div
            className={cn(
              getCardRecipeClassName(isActive ? "roadmapTimelineBarActive" : "roadmapTimelineBar"),
              "absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm transition-transform",
              getPriorityColor(issue.priority, "bg"),
              isActive && "scale-110",
            )}
          />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        getCardRecipeClassName(isActive ? "roadmapTimelineBarActive" : "roadmapTimelineBar"),
        "group absolute h-roadmap-bar",
        getPriorityColor(issue.priority, "bg"),
      )}
      style={{
        left: `${left}%`,
        width: `${width}%`,
      }}
    >
      <Flex align="center" className="h-full">
        {canEdit && issue.startDate ? (
          <Button
            chrome="roadmapResizeHandle"
            chromeSize="roadmapResizeLeft"
            reveal={true}
            onMouseDown={(e) => onResizeStart(e, issue._id, "left", issue.startDate, issue.dueDate)}
            title="Drag to change start date"
          >
            <div className="h-roadmap-grip w-roadmap-grip bg-ui-text-tertiary" />
          </Button>
        ) : null}

        <Button
          chrome="roadmapTimelineHitArea"
          chromeSize="roadmapTimelineLabel"
          data-testid={`roadmap-bar-${issue._id}`}
          onMouseDown={(e) => onBarDragStart(e, issue._id, issue.startDate, issue.dueDate)}
          onClick={() => onOpenIssue(issue._id)}
          title={getRoadmapBarTitle(issue, canEdit)}
          aria-label={`View issue ${issue.key}`}
        >
          <Flex align="center" justify="center" className="h-full">
            <Typography variant="label" className="truncate text-brand-foreground">
              {issue.assignee?.name?.split(" ")[0] ?? ""}
            </Typography>
          </Flex>
        </Button>

        {canEdit ? (
          <Button
            chrome="roadmapResizeHandle"
            chromeSize="roadmapResizeRight"
            reveal={true}
            onMouseDown={(e) =>
              onResizeStart(e, issue._id, "right", issue.startDate, issue.dueDate)
            }
            title="Drag to change due date"
          >
            <div className="h-roadmap-grip w-roadmap-grip bg-ui-text-tertiary" />
          </Button>
        ) : null}
      </Flex>
    </div>
  );
}

export function RoadmapGroupRow({
  getPositionOnTimeline,
  group,
  onToggle,
  style,
}: RoadmapGroupRowProps) {
  const epicSummaryDueDate = shouldRenderEpicSummaryBar(group) ? group.dueDate : undefined;
  const epicCompletionLabel = getSummaryCompletionLabel(group.completedCount, group.count);
  const epicCompletionPercentage = getSummaryCompletionPercentage(
    group.completedCount,
    group.count,
  );

  return (
    <Button
      type="button"
      chrome="roadmapGroupRow"
      chromeSize="roadmapGroupRow"
      onClick={() => onToggle(group.key)}
      aria-expanded={!group.collapsed}
      aria-label={`Toggle ${group.label} group`}
      style={style}
      data-testid={`roadmap-group-${group.key}`}
    >
      <Flex align="center">
        <FlexItem flex="none" className={getStickyGroupColumnClassName()}>
          <Flex align="center" justify="between" className="h-full">
            <Flex align="center" gap="sm">
              <Icon
                icon={group.collapsed ? ChevronRight : ChevronDown}
                size="sm"
                className="text-ui-text-tertiary"
              />
              <Typography variant="label" color="secondary">
                {getTimelineGroupLabel(group)}
              </Typography>
              <Badge
                variant="roadmapGroup"
                size="md"
                shape="pill"
                {...getTimelineGroupBadgeTone(group)}
              >
                {group.label}
              </Badge>
            </Flex>
            <Typography variant="caption" color="secondary">
              {group.count} {group.count === 1 ? "issue" : "issues"} · {epicCompletionPercentage}%
            </Typography>
          </Flex>
        </FlexItem>

        <FlexItem flex="1" className="relative h-roadmap-row">
          {group.startDate !== undefined && epicSummaryDueDate !== undefined ? (
            <div
              className={cn(
                getCardRecipeClassName("roadmapTimelineBar"),
                "absolute top-2 h-roadmap-summary border border-accent-border bg-accent-subtle px-2 text-accent-active opacity-90",
              )}
              style={{
                left: `${getBarLeft(group.startDate, epicSummaryDueDate, getPositionOnTimeline)}%`,
                width: `${getBarWidth(group.startDate, epicSummaryDueDate, getPositionOnTimeline)}%`,
              }}
              title={`Epic summary for ${group.label} · ${epicCompletionLabel}`}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-accent-active/20"
                style={{ width: `${epicCompletionPercentage}%` }}
              />
              <Flex align="center" justify="center" className="h-full">
                <Typography variant="caption" className="relative truncate">
                  {group.value}
                </Typography>
                <Typography variant="caption" className="relative shrink-0">
                  {epicCompletionPercentage}%
                </Typography>
              </Flex>
            </div>
          ) : null}
        </FlexItem>
      </Flex>
    </Button>
  );
}

export function RoadmapIssueIdentity({
  childCount,
  childrenCollapsed,
  hasChildren,
  isNestedSubtask,
  issue,
  onOpenIssue,
  onToggleChildren,
  parentIssue,
  selected,
  summaryDueDate,
  summaryStartDate,
}: RoadmapIssueIdentityProps) {
  const childToggleLabel = `${childrenCollapsed ? "Expand" : "Collapse"} subtasks for ${issue.key}`;
  const subtaskCaption = getRoadmapSubtaskCaption(
    childCount,
    hasChildren,
    isNestedSubtask,
    parentIssue,
  );
  const dateBadgeLabel = getRoadmapDateBadgeLabel(issue, summaryStartDate, summaryDueDate);
  const assigneeLabel = issue.assignee?.name?.trim() || "Unassigned";
  const statusLabel = getRoadmapStatusLabel(issue.status);
  const priorityLabel = getPriorityLabel(issue.priority);

  return (
    <div className="relative">
      {isNestedSubtask ? (
        <>
          <div className="absolute top-1 bottom-3 left-2 w-px bg-ui-border/80" />
          <div className="absolute top-4 left-2 h-px w-roadmap-tree-connector bg-ui-border/80" />
        </>
      ) : null}

      <Stack gap="xs" className={cn(isNestedSubtask && "pl-roadmap-subtask-indent")}>
        <Flex align="center" gap="sm">
          {hasChildren ? (
            <Button
              type="button"
              chrome="roadmapSubtaskToggle"
              chromeSize="roadmapSubtaskToggle"
              onClick={() => onToggleChildren(issue._id)}
              aria-expanded={!childrenCollapsed}
              aria-label={childToggleLabel}
            >
              <Icon icon={childrenCollapsed ? ChevronRight : ChevronDown} size="sm" />
            </Button>
          ) : (
            <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="sm" />
          )}
          {hasChildren ? <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="sm" /> : null}
          <Button
            chrome={selected ? "roadmapIssueKeyActive" : "roadmapIssueKey"}
            chromeSize="roadmapIssueKey"
            onClick={() => onOpenIssue(issue._id)}
            className="truncate"
          >
            {issue.key}
          </Button>
        </Flex>
        {subtaskCaption ? (
          <Typography variant="caption" color="secondary" className="truncate">
            {subtaskCaption}
          </Typography>
        ) : null}
        <Typography variant="caption" className="truncate">
          {issue.title}
        </Typography>
        <Flex align="center" gap="xs" wrap>
          <Badge shape="pill" statusTone={getStatusBadgeTone(issue.status)}>
            {statusLabel}
          </Badge>
          <Badge shape="pill" priorityTone={getPriorityBadgeTone(issue.priority)}>
            {priorityLabel}
          </Badge>
          <Badge variant="secondary" shape="pill">
            {assigneeLabel}
          </Badge>
          {dateBadgeLabel ? (
            <Badge variant="secondary" shape="pill">
              {dateBadgeLabel}
            </Badge>
          ) : null}
        </Flex>
      </Stack>
    </div>
  );
}

export function RoadmapSummaryBar({
  completedCount,
  dueDate,
  getPositionOnTimeline,
  issueKey,
  totalCount,
  startDate,
}: RoadmapSummaryBarProps) {
  const completionLabel = getSummaryCompletionLabel(completedCount, totalCount);
  const completionPercentage = getSummaryCompletionPercentage(completedCount, totalCount);

  return (
    <div
      className={cn(
        getCardRecipeClassName("roadmapTimelineBar"),
        "absolute top-2 h-roadmap-summary border border-accent-border bg-accent-subtle px-2 text-accent-active opacity-90",
      )}
      style={{
        left: `${getBarLeft(startDate, dueDate, getPositionOnTimeline)}%`,
        width: `${getBarWidth(startDate, dueDate, getPositionOnTimeline)}%`,
      }}
      title={`Task rollup for ${issueKey} · ${completionLabel}`}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-accent-active/20"
        style={{ width: `${completionPercentage}%` }}
      />
      <Flex align="center" justify="center" className="h-full">
        <Typography variant="caption" className="relative truncate">
          Rollup
        </Typography>
        <Typography variant="caption" className="relative shrink-0">
          {completionPercentage}%
        </Typography>
      </Flex>
    </div>
  );
}

export function RoadmapIssueRow({
  childCount,
  canEdit,
  childrenCollapsed,
  depth,
  draggingIssueId,
  getPositionOnTimeline,
  hasChildren,
  issue,
  onBarDragStart,
  onOpenIssue,
  onToggleChildren,
  onResizeStart,
  resizingIssueId,
  selected,
  summaryCompletedCount,
  summaryDueDate,
  summaryStartDate,
  style,
  timelineRef,
  parentIssue,
}: RoadmapIssueRowProps) {
  const isNestedSubtask = depth === 1 && parentIssue !== null;
  const shouldRenderSummaryBar =
    issue.dueDate === undefined && hasChildren && summaryDueDate !== undefined;

  return (
    <Card
      recipe={selected ? "roadmapRowSelected" : "roadmapRow"}
      style={style}
      className={cn("group transition-colors", selected && "z-10")}
    >
      <Flex align="center">
        <FlexItem
          shrink={false}
          className={getStickyIssueColumnClassName(selected)}
          data-testid={TEST_IDS.ROADMAP.ISSUE_COLUMN}
        >
          <RoadmapIssueIdentity
            childCount={childCount}
            childrenCollapsed={childrenCollapsed}
            hasChildren={hasChildren}
            isNestedSubtask={isNestedSubtask}
            issue={issue}
            onOpenIssue={onOpenIssue}
            onToggleChildren={onToggleChildren}
            parentIssue={parentIssue}
            selected={selected}
            summaryDueDate={summaryDueDate}
            summaryStartDate={summaryStartDate}
          />
        </FlexItem>

        <FlexItem flex="1" className="relative h-roadmap-row" ref={timelineRef}>
          {issue.dueDate ? (
            <RoadmapTimelineBar
              canEdit={canEdit}
              draggingIssueId={draggingIssueId}
              getPositionOnTimeline={getPositionOnTimeline}
              issue={{
                _id: issue._id,
                assignee: issue.assignee ?? undefined,
                dueDate: issue.dueDate,
                key: issue.key,
                priority: issue.priority,
                startDate: issue.startDate,
                title: issue.title,
              }}
              onBarDragStart={onBarDragStart}
              onOpenIssue={onOpenIssue}
              onResizeStart={onResizeStart}
              resizingIssueId={resizingIssueId}
            />
          ) : shouldRenderSummaryBar ? (
            <RoadmapSummaryBar
              completedCount={summaryCompletedCount}
              dueDate={summaryDueDate}
              getPositionOnTimeline={getPositionOnTimeline}
              issueKey={issue.key}
              totalCount={childCount}
              startDate={summaryStartDate}
            />
          ) : null}
        </FlexItem>
      </Flex>
    </Card>
  );
}
