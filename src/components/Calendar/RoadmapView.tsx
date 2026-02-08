import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Typography } from "@/components/ui/Typography";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Flex } from "../ui/Flex";
import { ResponsiveText } from "../ui/ResponsiveText";

interface RoadmapViewProps {
  projectId: Id<"projects">;
}

type TimeScale = "week" | "month" | "quarter";

export function RoadmapView({ projectId }: RoadmapViewProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate date range based on time scale
  const { startDate, endDate, columns } = getDateRange(currentDate, timeScale);

  // Fetch issues and sprints with backend filters (avoids client-side filtering)
  const issues = useQuery(api.issues.listRoadmapIssues, {
    projectId,
    hasDueDate: true, // Only issues with due dates
  });
  const sprints = useQuery(api.sprints.listByProject, {
    projectId,
    hasDates: true, // Only sprints with start and end dates
  });

  type Sprint = NonNullable<FunctionReturnType<typeof api.sprints.listByProject>>[number];
  type Issue = NonNullable<FunctionReturnType<typeof api.issues.listRoadmapIssues>>[number];

  // Map to roadmap items (no filtering needed - backend already filtered)
  const roadmapItems = [
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

  // Sort by start date
  const sortedItems = roadmapItems.sort((a, b) => a.startDate - b.startDate);

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

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getHeaderText = () => {
    if (timeScale === "week") {
      const endOfWeek = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else if (timeScale === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      const q = Math.floor(currentDate.getMonth() / 3) + 1;
      return `Q${q} ${currentDate.getFullYear()}`;
    }
  };

  return (
    <Flex direction="column" className="h-full bg-ui-bg">
      {/* Header */}
      <div className="border-b border-ui-border p-3 sm:p-4">
        <Flex
          direction="column"
          gap="md"
          className="sm:flex-row items-stretch sm:items-center justify-between sm:gap-4"
        >
          <Flex gap="lg" align="center" className="gap-2 sm:gap-4">
            <button
              type="button"
              onClick={handleToday}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-ui-border rounded-md hover:bg-ui-bg-tertiary"
            >
              Today
            </button>
            <Flex gap="sm" align="center" className="gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                className="p-1 hover:bg-ui-bg-tertiary rounded"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 hover:bg-ui-bg-tertiary rounded"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </Flex>
            <Typography
              variant="h2"
              className="text-base sm:text-lg font-semibold text-ui-text truncate"
            >
              {getHeaderText()}
            </Typography>
          </Flex>

          {/* Time Scale Toggle */}
          <Flex className="border border-ui-border rounded-md shrink-0">
            <button
              type="button"
              onClick={() => setTimeScale("week")}
              className={cn(
                "px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-l-md",
                timeScale === "week"
                  ? "bg-brand text-brand-foreground"
                  : "bg-ui-bg text-ui-text hover:bg-ui-bg-tertiary",
              )}
            >
              <ResponsiveText short="W" long="Week" />
            </button>
            <button
              type="button"
              onClick={() => setTimeScale("month")}
              className={cn(
                "px-2 sm:px-3 py-1.5 text-xs sm:text-sm border-l border-ui-border",
                timeScale === "month"
                  ? "bg-brand text-brand-foreground"
                  : "bg-ui-bg text-ui-text hover:bg-ui-bg-tertiary",
              )}
            >
              <ResponsiveText short="M" long="Month" />
            </button>
            <button
              type="button"
              onClick={() => setTimeScale("quarter")}
              className={cn(
                "px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-r-md border-l border-ui-border",
                timeScale === "quarter"
                  ? "bg-brand text-brand-foreground"
                  : "bg-ui-bg text-ui-text hover:bg-ui-bg-tertiary",
              )}
            >
              <ResponsiveText short="Q" long="Quarter" />
            </button>
          </Flex>
        </Flex>
      </div>

      {/* Roadmap Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Timeline Header */}
          <div className="sticky top-0 z-10 bg-ui-bg-secondary border-b border-ui-border">
            <Flex>
              <Typography
                variant="label"
                className="w-40 sm:w-48 md:w-64 shrink-0 p-2 sm:p-3 border-r border-ui-border text-ui-text"
              >
                Item
              </Typography>
              <Flex className="flex-1">
                {columns.map((col) => (
                  <Typography
                    key={col.date.getTime()}
                    variant="label"
                    className="flex-1 p-2 sm:p-3 border-r border-ui-border text-center text-ui-text"
                  >
                    {col.label}
                  </Typography>
                ))}
              </Flex>
            </Flex>
          </div>

          {/* Roadmap Items */}
          {sortedItems.length === 0 ? (
            <Typography variant="muted" className="p-4 sm:p-8 text-center">
              No items with dates found. Add due dates to issues or create sprints to see them here.
            </Typography>
          ) : (
            <div>
              {sortedItems.map((item) => (
                <Flex className="border-b border-ui-border" key={`${item.type}-${item.id}`}>
                  {/* Item Info */}
                  <div className="w-40 sm:w-48 md:w-64 shrink-0 p-2 sm:p-3 border-r border-ui-border">
                    <Flex gap="sm" align="center" className="gap-1 sm:gap-2">
                      {item.type === "sprint" ? (
                        <Badge variant="accent" size="md">
                          Sprint
                        </Badge>
                      ) : (
                        <Badge variant={getIssueTypeVariant(item.issueType)} size="md">
                          {item.issueType}
                        </Badge>
                      )}
                    </Flex>
                    <Typography variant="label" className="text-ui-text mt-1 truncate">
                      {item.title}
                    </Typography>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 relative">
                    <Flex className="absolute inset-0">
                      {columns.map((col) => (
                        <div
                          key={col.date.getTime()}
                          className="flex-1 border-r border-ui-border"
                        />
                      ))}
                    </Flex>

                    {/* Date Bar */}
                    <Flex align="center" className="absolute inset-y-0 px-2">
                      {renderDateBar(item, startDate, endDate, columns.length)}
                    </Flex>
                  </div>
                </Flex>
              ))}
            </div>
          )}
        </div>
      </div>
    </Flex>
  );
}

// Render a date bar for an item
function renderDateBar(
  item: { startDate: number; endDate: number; [key: string]: unknown },
  rangeStart: Date,
  rangeEnd: Date,
  _columnCount: number,
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

  const color =
    item.type === "sprint"
      ? "bg-accent-ring"
      : item.priority === "highest" || item.priority === "high"
        ? "bg-status-error"
        : item.priority === "medium"
          ? "bg-status-warning"
          : "bg-brand-ring";

  return (
    <div
      className={cn(
        color,
        "rounded-full h-6 flex items-center justify-center text-brand-foreground text-xs font-medium overflow-hidden whitespace-nowrap px-2",
      )}
      style={{
        marginLeft: `${leftPercent}%`,
        width: `${widthPercent}%`,
        minWidth: "40px",
      }}
    >
      {itemStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
      {itemEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
    </div>
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
