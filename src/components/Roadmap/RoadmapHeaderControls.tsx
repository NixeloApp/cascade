/** Toolbar controls for the Roadmap view — filters, timeline navigation, zoom, grouping. */

import type { Id } from "@convex/_generated/dataModel";
import { ChevronLeft, ChevronRight, LinkIcon } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { SegmentedControl, SegmentedControlItem } from "../ui/SegmentedControl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Typography } from "../ui/Typography";
import type { GroupBy, RoadmapEpic, TimelineSpan, TimelineZoom, ViewMode } from "./types";
import { GROUP_BY_OPTIONS, TIMELINE_SPANS, TIMELINE_ZOOM_OPTIONS } from "./types";
import type { getTimelineFitWindow } from "./utils";

/** Toolbar with epic filter, timeline navigation, zoom, grouping, and dependency toggle. */
export function RoadmapHeaderControls({
  epics,
  filterEpic,
  fitTimelineWindow,
  groupBy,
  nextWindowLabel,
  onFilterEpicChange,
  onFitToIssues,
  onGroupByChange,
  onNextWindow,
  onPreviousWindow,
  onTimelineSpanChange,
  onTimelineZoomChange,
  onToday,
  onToggleDependencies,
  onViewModeChange,
  previousWindowLabel,
  showDependencies,
  timelineRangeLabel,
  timelineSpan,
  timelineZoom,
  viewMode,
}: {
  epics: RoadmapEpic[];
  filterEpic: Id<"issues"> | "all";
  fitTimelineWindow: ReturnType<typeof getTimelineFitWindow>;
  groupBy: GroupBy;
  nextWindowLabel: string;
  onFilterEpicChange: (value: Id<"issues"> | "all") => void;
  onFitToIssues: () => void;
  onGroupByChange: (value: GroupBy) => void;
  onNextWindow: () => void;
  onPreviousWindow: () => void;
  onTimelineSpanChange: (value: TimelineSpan) => void;
  onTimelineZoomChange: (value: TimelineZoom) => void;
  onToday: () => void;
  onToggleDependencies: () => void;
  onViewModeChange: (value: ViewMode) => void;
  previousWindowLabel: string;
  showDependencies: boolean;
  timelineRangeLabel: string;
  timelineSpan: TimelineSpan;
  timelineZoom: TimelineZoom;
  viewMode: ViewMode;
}) {
  return (
    <Card recipe="controlRail" padding="xs" radius="full">
      <Flex align="center" gap="sm" wrap>
        <Flex align="center" gap="xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreviousWindow}
            aria-label={previousWindowLabel}
            title={previousWindowLabel}
          >
            <Icon icon={ChevronLeft} size="sm" />
          </Button>
          <Button variant="secondary" size="sm" onClick={onToday}>
            Today
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onFitToIssues}
            disabled={fitTimelineWindow === null}
          >
            Fit to issues
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextWindow}
            aria-label={nextWindowLabel}
            title={nextWindowLabel}
          >
            <Icon icon={ChevronRight} size="sm" />
          </Button>
        </Flex>

        <Typography
          variant="label"
          color="secondary"
          className="min-w-36"
          data-testid={TEST_IDS.ROADMAP.RANGE_LABEL}
        >
          {timelineRangeLabel}
        </Typography>

        <Select
          value={filterEpic === "all" ? "all" : filterEpic}
          onValueChange={(value) =>
            onFilterEpicChange(value === "all" ? "all" : (value as Id<"issues">))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Epics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Epics</SelectItem>
            {epics.map((epic) => (
              <SelectItem key={epic._id} value={epic._id}>
                {epic.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(timelineSpan)}
          onValueChange={(value) => onTimelineSpanChange(Number(value) as TimelineSpan)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMELINE_SPANS.map((span) => (
              <SelectItem key={span.value} value={String(span.value)}>
                {span.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={groupBy} onValueChange={(value) => onGroupByChange(value as GroupBy)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROUP_BY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <SegmentedControl
          value={viewMode}
          onValueChange={(value: string) => value && onViewModeChange(value as ViewMode)}
          size="sm"
        >
          <SegmentedControlItem value="months">Months</SegmentedControlItem>
          <SegmentedControlItem value="weeks">Weeks</SegmentedControlItem>
        </SegmentedControl>

        <SegmentedControl
          value={timelineZoom}
          onValueChange={(value: string) => value && onTimelineZoomChange(value as TimelineZoom)}
          size="sm"
        >
          {TIMELINE_ZOOM_OPTIONS.map((option) => (
            <SegmentedControlItem key={option.value} value={option.value}>
              {option.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>

        <Button
          variant={showDependencies ? "primary" : "ghost"}
          size="sm"
          onClick={onToggleDependencies}
          title={showDependencies ? "Hide dependency lines" : "Show dependency lines"}
        >
          <Icon icon={LinkIcon} size="sm" />
        </Button>
      </Flex>
    </Card>
  );
}
