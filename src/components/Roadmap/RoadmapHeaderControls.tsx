/** Toolbar controls for the Roadmap view — filters, timeline navigation, zoom, grouping. */

import type { Id } from "@convex/_generated/dataModel";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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

const VIEW_MODE_OPTIONS: { label: string; value: ViewMode }[] = [
  { label: "Months", value: "months" },
  { label: "Weeks", value: "weeks" },
];

function isTimelineSpan(value: number): value is TimelineSpan {
  return TIMELINE_SPANS.some((span) => span.value === value);
}

function isGroupBy(value: string): value is GroupBy {
  return GROUP_BY_OPTIONS.some((option) => option.value === value);
}

function isTimelineZoom(value: string): value is TimelineZoom {
  return TIMELINE_ZOOM_OPTIONS.some((option) => option.value === value);
}

function isViewMode(value: string): value is ViewMode {
  return VIEW_MODE_OPTIONS.some((option) => option.value === value);
}

interface RoadmapHeaderControlsProps {
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
}

type RoadmapWindowControlsProps = Pick<
  RoadmapHeaderControlsProps,
  | "fitTimelineWindow"
  | "nextWindowLabel"
  | "onFitToIssues"
  | "onNextWindow"
  | "onPreviousWindow"
  | "onToday"
  | "previousWindowLabel"
>;

type RoadmapFilterControlsProps = Pick<
  RoadmapHeaderControlsProps,
  | "epics"
  | "filterEpic"
  | "groupBy"
  | "onFilterEpicChange"
  | "onGroupByChange"
  | "onTimelineSpanChange"
  | "timelineRangeLabel"
  | "timelineSpan"
> & {
  isNarrowViewport: boolean;
};

type RoadmapDisplayControlsProps = Pick<
  RoadmapHeaderControlsProps,
  | "onTimelineZoomChange"
  | "onToggleDependencies"
  | "onViewModeChange"
  | "showDependencies"
  | "timelineZoom"
  | "viewMode"
> & {
  isNarrowViewport: boolean;
};

function RoadmapWindowControls({
  fitTimelineWindow,
  nextWindowLabel,
  onFitToIssues,
  onNextWindow,
  onPreviousWindow,
  onToday,
  previousWindowLabel,
}: RoadmapWindowControlsProps) {
  return (
    <Flex
      align="center"
      justify="between"
      gap="xs"
      wrap
      className="w-full sm:w-auto sm:justify-start"
    >
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
  );
}

function RoadmapTimelineRangeLabel({ timelineRangeLabel }: { timelineRangeLabel: string }) {
  return (
    <Typography
      variant="label"
      color="secondary"
      className="w-full min-w-0 sm:w-auto sm:min-w-36"
      data-testid={TEST_IDS.ROADMAP.RANGE_LABEL}
    >
      {timelineRangeLabel}
    </Typography>
  );
}

function RoadmapFilterControls({
  epics,
  filterEpic,
  groupBy,
  isNarrowViewport,
  onFilterEpicChange,
  onGroupByChange,
  onTimelineSpanChange,
  timelineRangeLabel,
  timelineSpan,
}: RoadmapFilterControlsProps) {
  const epicFilterWidth = isNarrowViewport ? "full" : "md";
  const timelineSpanWidth = isNarrowViewport ? "full" : "sm";
  const groupByWidth = isNarrowViewport ? "full" : "md";

  const handleEpicChange = (value: string) => {
    onFilterEpicChange(value === "all" ? "all" : (value as Id<"issues">));
  };

  const handleTimelineSpanChange = (value: string) => {
    const parsedValue = Number(value);
    if (isTimelineSpan(parsedValue)) {
      onTimelineSpanChange(parsedValue);
    }
  };

  const handleGroupByChange = (value: string) => {
    if (isGroupBy(value)) {
      onGroupByChange(value);
    }
  };

  return (
    <Flex
      direction="column"
      gap="sm"
      className="w-full sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
    >
      <RoadmapTimelineRangeLabel timelineRangeLabel={timelineRangeLabel} />

      <Select value={filterEpic === "all" ? "all" : filterEpic} onValueChange={handleEpicChange}>
        <SelectTrigger width={epicFilterWidth}>
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

      <Select value={String(timelineSpan)} onValueChange={handleTimelineSpanChange}>
        <SelectTrigger
          width={timelineSpanWidth}
          data-testid={TEST_IDS.ROADMAP.TIMELINE_SPAN_SELECT}
        >
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

      <Select value={groupBy} onValueChange={handleGroupByChange}>
        <SelectTrigger width={groupByWidth} data-testid={TEST_IDS.ROADMAP.GROUP_BY_SELECT}>
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
    </Flex>
  );
}

function RoadmapDisplayControls({
  isNarrowViewport,
  onTimelineZoomChange,
  onToggleDependencies,
  onViewModeChange,
  showDependencies,
  timelineZoom,
  viewMode,
}: RoadmapDisplayControlsProps) {
  const segmentedControlWidth = isNarrowViewport ? "fill" : "auto";

  const handleViewModeChange = (value: string) => {
    if (isViewMode(value)) {
      onViewModeChange(value);
    }
  };

  const handleTimelineZoomChange = (value: string) => {
    if (isTimelineZoom(value)) {
      onTimelineZoomChange(value);
    }
  };

  return (
    <Flex
      direction="column"
      gap="sm"
      className="w-full sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
    >
      <SegmentedControl
        value={viewMode}
        onValueChange={handleViewModeChange}
        size="sm"
        width={segmentedControlWidth}
        className="w-full sm:w-auto"
      >
        {VIEW_MODE_OPTIONS.map((option) => (
          <SegmentedControlItem key={option.value} value={option.value}>
            {option.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>

      <SegmentedControl
        value={timelineZoom}
        onValueChange={handleTimelineZoomChange}
        size="sm"
        width={segmentedControlWidth}
        className="w-full sm:w-auto"
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
        className="w-full sm:w-auto"
        data-testid={TEST_IDS.ROADMAP.DEPENDENCIES_TOGGLE}
      >
        <Icon icon={LinkIcon} size="sm" />
      </Button>
    </Flex>
  );
}

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
}: RoadmapHeaderControlsProps) {
  const isNarrowViewport = useMediaQuery("(max-width: 639px)");

  return (
    <Card
      recipe="controlRail"
      padding="xs"
      radius={isNarrowViewport ? "lg" : "full"}
      className="w-full sm:w-auto"
      data-testid={TEST_IDS.ROADMAP.HEADER_CONTROLS}
    >
      <Flex direction="column" gap="sm" className="w-full sm:flex-row sm:flex-wrap sm:items-center">
        <RoadmapWindowControls
          fitTimelineWindow={fitTimelineWindow}
          nextWindowLabel={nextWindowLabel}
          onFitToIssues={onFitToIssues}
          onNextWindow={onNextWindow}
          onPreviousWindow={onPreviousWindow}
          onToday={onToday}
          previousWindowLabel={previousWindowLabel}
        />
        <RoadmapFilterControls
          epics={epics}
          filterEpic={filterEpic}
          groupBy={groupBy}
          isNarrowViewport={isNarrowViewport}
          onFilterEpicChange={onFilterEpicChange}
          onGroupByChange={onGroupByChange}
          onTimelineSpanChange={onTimelineSpanChange}
          timelineRangeLabel={timelineRangeLabel}
          timelineSpan={timelineSpan}
        />
        <RoadmapDisplayControls
          isNarrowViewport={isNarrowViewport}
          onTimelineZoomChange={onTimelineZoomChange}
          onToggleDependencies={onToggleDependencies}
          onViewModeChange={onViewModeChange}
          showDependencies={showDependencies}
          timelineZoom={timelineZoom}
          viewMode={viewMode}
        />
      </Flex>
    </Card>
  );
}
