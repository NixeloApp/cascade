/**
 * Roadmap View
 *
 * Timeline visualization of issues with due dates for sprint planning.
 * Supports week, month, and quarter time scales with horizontal scrolling.
 * Issues are displayed as bars positioned by start and end dates.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { DAY } from "@convex/lib/timeUtils";
import type { FunctionReturnType } from "convex/server";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { CalendarDays, ChevronLeft, ChevronRight } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { IconButton } from "../ui/IconButton";
import { ResponsiveText } from "../ui/ResponsiveText";
import { SegmentedControl, SegmentedControlItem } from "../ui/SegmentedControl";

interface RoadmapViewProps {
  projectId: Id<"projects">;
}

type TimeScale = "week" | "month" | "quarter";
type BaseRoadmapItem = {
  id: string;
  title: string;
  startDate: number;
  endDate: number;
  status: string;
};

type SprintRoadmapItem = BaseRoadmapItem & {
  type: "sprint";
};

type IssueRoadmapItem = BaseRoadmapItem & {
  type: "issue";
  dueDate: number;
  issueType: string;
  priority?: string;
};

type RoadmapItem = SprintRoadmapItem | IssueRoadmapItem;

const TIME_SCALE_OPTIONS: Array<{ value: TimeScale; short: string; long: string }> = [
  { value: "week", short: "W", long: "Week" },
  { value: "month", short: "M", long: "Month" },
  { value: "quarter", short: "Q", long: "Quarter" },
];

/**
 * Timeline/Gantt-style roadmap view showing issues and sprints on a timeline.
 */
export function RoadmapView({ projectId }: RoadmapViewProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate date range based on time scale
  const { startDate, endDate, columns } = getDateRange(currentDate, timeScale);

  // Fetch issues and sprints with backend filters (avoids client-side filtering)
  const issues = useAuthenticatedQuery(api.issues.listRoadmapIssues, {
    projectId,
    hasDueDate: true, // Only issues with due dates
  });
  const sprints = useAuthenticatedQuery(api.sprints.listByProject, {
    projectId,
    hasDates: true, // Only sprints with start and end dates
  });

  type Sprint = NonNullable<FunctionReturnType<typeof api.sprints.listByProject>>[number];
  type Issue = NonNullable<FunctionReturnType<typeof api.issues.listRoadmapIssues>>[number];

  const sortedItems = useMemo(() => {
    // Map to roadmap items (no filtering needed - backend already filtered)
    const roadmapItems: RoadmapItem[] = [
      ...(sprints?.map((sprint: Sprint) => ({
        type: "sprint" as const,
        id: sprint._id,
        title: sprint.name,
        startDate: sprint.startDate as number,
        endDate: sprint.endDate as number,
        status: sprint.status,
      })) || []),
      ...(issues?.map((issue: Issue) => ({
        type: "issue" as const,
        id: issue._id,
        title: `${issue.key}: ${issue.title}`,
        dueDate: issue.dueDate as number,
        startDate: issue._creationTime,
        endDate: issue.dueDate as number,
        issueType: issue.type,
        priority: issue.priority,
        status: issue.status,
      })) || []),
    ];

    return roadmapItems.slice().sort((a, b) => a.startDate - b.startDate);
  }, [issues, sprints]);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (timeScale === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (timeScale === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 3);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (timeScale === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (timeScale === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 3);
    }
    setCurrentDate(newDate);
  };

  const getTimeScaleLabel = () => {
    switch (timeScale) {
      case "week":
        return "week";
      case "month":
        return "month";
      case "quarter":
        return "quarter";
      default:
        return "time period";
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleTimeScaleChange = (value: string) => {
    if (value === "week" || value === "month" || value === "quarter") {
      setTimeScale(value);
    }
  };

  const getHeaderText = () => {
    if (timeScale === "week") {
      const endOfWeek = new Date(startDate.getTime() + 6 * DAY);
      return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else if (timeScale === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      const q = Math.floor(currentDate.getMonth() / 3) + 1;
      return `Q${q} ${currentDate.getFullYear()}`;
    }
  };

  return (
    <Card recipe="calendarRoadmapShell">
      {/* Header */}
      <Card recipe="calendarRoadmapHeader" padding="sm" radius="none">
        <Flex
          direction="column"
          directionSm="row"
          gap="md"
          gapSm="lg"
          align="stretch"
          alignSm="center"
          justify="between"
        >
          <Flex gap="sm" gapSm="lg" align="center">
            <Button variant="secondary" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Flex gap="xs" gapSm="sm" align="center">
              <IconButton
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                aria-label={`Previous ${getTimeScaleLabel()}`}
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </IconButton>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={handleNext}
                aria-label={`Next ${getTimeScaleLabel()}`}
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </IconButton>
            </Flex>
            <Typography variant="h2" className="truncate">
              {getHeaderText()}
            </Typography>
          </Flex>

          {/* Time Scale Toggle */}
          <SegmentedControl
            value={timeScale}
            onValueChange={handleTimeScaleChange}
            variant="outline"
            size="sm"
            aria-label="Time scale"
          >
            {TIME_SCALE_OPTIONS.map((option) => (
              <SegmentedControlItem
                key={option.value}
                value={option.value}
                aria-label={option.long}
              >
                <ResponsiveText short={option.short} long={option.long} />
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </Flex>
      </Card>

      {/* Roadmap Grid */}
      <FlexItem flex="1" className="overflow-auto">
        <div className="min-w-max">
          {/* Timeline Header */}
          <Card recipe="calendarRoadmapTimelineHeader" className="sticky top-0 z-10">
            <Flex>
              <Card recipe="calendarRoadmapItemHeader">
                <Typography variant="label">Item</Typography>
              </Card>
              <FlexItem flex="1">
                <Flex>
                  {columns.map((col) => (
                    <FlexItem key={col.date.getTime()} flex="1">
                      <Card recipe="calendarRoadmapDateHeader">
                        <Typography className="text-center" variant="label">
                          {col.label}
                        </Typography>
                      </Card>
                    </FlexItem>
                  ))}
                </Flex>
              </FlexItem>
            </Flex>
          </Card>

          {/* Roadmap Items */}
          {sortedItems.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No roadmap items yet"
              description="Add due dates to issues or create dated sprints to see them here."
              size="compact"
              surface="bare"
            />
          ) : (
            <ul className="list-none" style={{ margin: 0, padding: 0 }}>
              {sortedItems.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <Card recipe={item.type === "sprint" ? "roadmapRowSelected" : "roadmapRow"}>
                    <Flex>
                      <Card recipe="calendarRoadmapItemInfo">
                        <Flex direction="column" gap="xs">
                          {item.type === "sprint" ? (
                            <Badge variant="accent" size="md">
                              Sprint
                            </Badge>
                          ) : (
                            <Badge variant={getIssueTypeVariant(item.issueType)} size="md">
                              {item.issueType}
                            </Badge>
                          )}
                          <Typography variant="label" className="truncate">
                            {item.title}
                          </Typography>
                        </Flex>
                      </Card>

                      {/* Timeline Bar */}
                      <FlexItem flex="1" className="relative">
                        <Flex className="absolute inset-0">
                          {columns.map((col) => (
                            <FlexItem key={col.date.getTime()} flex="1">
                              <Card recipe="calendarRoadmapTimelineCell" />
                            </FlexItem>
                          ))}
                        </Flex>

                        {/* Date Bar */}
                        <Card recipe="calendarRoadmapBarLane" className="w-full">
                          {renderDateBar(item, startDate, endDate)}
                        </Card>
                      </FlexItem>
                    </Flex>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </FlexItem>
    </Card>
  );
}

// Render a date bar for an item
function renderDateBar(
  item: { startDate: number; endDate: number; [key: string]: unknown },
  rangeStart: Date,
  rangeEnd: Date,
) {
  const itemStart = new Date(item.startDate);
  const itemEnd = new Date(item.endDate);

  const rangeStartTime = rangeStart.getTime();
  const rangeEndTime = rangeEnd.getTime();
  const rangeDuration = rangeEndTime - rangeStartTime;

  const itemStartTime = Math.max(itemStart.getTime(), rangeStartTime);
  const itemEndTime = Math.min(itemEnd.getTime(), rangeEndTime);

  // Item is outside visible range
  if (itemEndTime <= rangeStartTime || itemStartTime >= rangeEndTime) {
    return null;
  }

  const leftPercent = ((itemStartTime - rangeStartTime) / rangeDuration) * 100;
  const widthPercent = ((itemEndTime - itemStartTime) / rangeDuration) * 100;

  const dateRangeLabel = `${itemStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${itemEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <Card
      recipe={getRoadmapBarRecipe(item)}
      className="h-6 overflow-hidden whitespace-nowrap"
      style={{
        marginLeft: `${leftPercent}%`,
        width: `${widthPercent}%`,
        minWidth: "40px",
      }}
      title={dateRangeLabel}
    >
      <Typography className="truncate text-brand-foreground text-center" variant="small">
        {dateRangeLabel}
      </Typography>
    </Card>
  );
}

// Get date range and columns
function getDateRange(currentDate: Date, timeScale: TimeScale) {
  if (timeScale === "week") {
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const columns = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return {
        label: date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        date,
      };
    });

    return { startDate, endDate, columns };
  } else if (timeScale === "month") {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    ).getDate();

    // Show weeks for month view
    const weeks = Math.ceil(daysInMonth / 7);
    const columns = Array.from({ length: weeks }, (_, i) => {
      const weekStart = new Date(startDate);
      weekStart.setDate(1 + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return {
        label: `Week ${i + 1}`,
        date: weekStart,
      };
    });

    return { startDate, endDate, columns };
  } else {
    // Quarter
    const quarterStart = Math.floor(currentDate.getMonth() / 3) * 3;
    const startDate = new Date(currentDate.getFullYear(), quarterStart, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(currentDate.getFullYear(), quarterStart + 3, 1);

    const columns = [
      {
        label: new Date(currentDate.getFullYear(), quarterStart, 1).toLocaleDateString("en-US", {
          month: "short",
        }),
        date: new Date(currentDate.getFullYear(), quarterStart, 1),
      },
      {
        label: new Date(currentDate.getFullYear(), quarterStart + 1, 1).toLocaleDateString(
          "en-US",
          { month: "short" },
        ),
        date: new Date(currentDate.getFullYear(), quarterStart + 1, 1),
      },
      {
        label: new Date(currentDate.getFullYear(), quarterStart + 2, 1).toLocaleDateString(
          "en-US",
          { month: "short" },
        ),
        date: new Date(currentDate.getFullYear(), quarterStart + 2, 1),
      },
    ];

    return { startDate, endDate, columns };
  }
}

// Get issue type variant for Badge component
function getIssueTypeVariant(
  type: string,
):
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral"
  | "brand"
  | "accent" {
  switch (type) {
    case "epic":
      return "accent";
    case "story":
      return "success";
    case "task":
      return "brand";
    case "bug":
      return "error";
    default:
      return "neutral";
  }
}

function getRoadmapBarRecipe(item: {
  [key: string]: unknown;
  type?: unknown;
  priority?: unknown;
}):
  | "roadmapTimelineBarSprint"
  | "roadmapTimelineBarHigh"
  | "roadmapTimelineBarMedium"
  | "roadmapTimelineBarLow" {
  if (item.type === "sprint") {
    return "roadmapTimelineBarSprint";
  }

  if (item.priority === "highest" || item.priority === "high") {
    return "roadmapTimelineBarHigh";
  }

  if (item.priority === "medium") {
    return "roadmapTimelineBarMedium";
  }

  return "roadmapTimelineBarLow";
}
