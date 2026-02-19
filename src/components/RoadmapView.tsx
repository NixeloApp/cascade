import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef, useState } from "react";
import { List, type ListImperativeAPI } from "react-window";
import { PageLayout } from "@/components/layout";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { useListNavigation } from "@/hooks/useListNavigation";
import { formatDate } from "@/lib/dates";
import { getPriorityColor, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import { IssueDetailModal } from "./IssueDetailModal";
import { Card } from "./ui/Card";
import { Icon } from "./ui/Icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { Skeleton } from "./ui/Skeleton";
import { Stack } from "./ui/Stack";
import { ToggleGroup, ToggleGroupItem } from "./ui/ToggleGroup";
import { Typography } from "./ui/Typography";

// Pure function - no need to be inside component

interface RoadmapViewProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  canEdit?: boolean;
}

export function RoadmapView({ projectId, sprintId, canEdit = true }: RoadmapViewProps) {
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [viewMode, setViewMode] = useState<"months" | "weeks">("months");
  const [filterEpic, setFilterEpic] = useState<Id<"issues"> | "all">("all");

  // Fetch epics for the dropdown (separate optimized query)
  const epics = useQuery(api.issues.listEpics, { projectId });

  // Fetch filtered issues - backend applies all filters
  const filteredIssues = useQuery(api.issues.listRoadmapIssues, {
    projectId,
    sprintId,
    excludeEpics: true, // Don't include epics in main list
    epicId: filterEpic !== "all" ? filterEpic : undefined, // Filter by selected epic
    hasDueDate: true, // Only show issues with due dates
  });

  const project = useQuery(api.projects.getProject, { id: projectId });

  type RoadmapIssue = FunctionReturnType<typeof api.issues.listRoadmapIssues>[number];
  type Epic = NonNullable<FunctionReturnType<typeof api.issues.listEpics>>[number];

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 6, 0); // 6 months ahead

  // Generate timeline columns
  const timelineMonths: Date[] = [];
  for (let i = 0; i < 6; i++) {
    timelineMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
  }

  function getPositionOnTimeline(date: number) {
    const issueDate = new Date(date);
    const totalDays = Math.floor(
      (endDate.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysSinceStart = Math.floor(
      (issueDate.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24),
    );
    return (daysSinceStart / totalDays) * 100;
  }

  // Keyboard navigation
  const listRef = useRef<ListImperativeAPI>(null);
  const { selectedIndex } = useListNavigation({
    items: filteredIssues ?? [],
    onSelect: (issue: RoadmapIssue) => setSelectedIssue(issue._id),
  });

  // Sync keyboard selection with scroll
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      listRef.current.scrollToRow({ index: selectedIndex });
    }
  }, [selectedIndex]);

  // Row renderer for virtualization
  type RowData = {
    issues: typeof filteredIssues;
    selectedIndex: number;
  };

  function Row({
    issues,
    selectedIndex,
    index,
    style,
  }: RowData & {
    index: number;
    style: React.CSSProperties;
  }) {
    if (!issues) return null;
    const issue = issues[index];
    const isSelected = index === selectedIndex;

    return (
      <Flex
        align="center"
        style={style}
        className={cn(
          "transition-colors border-b border-ui-border",
          isSelected
            ? "bg-brand-subtle/50 ring-1 ring-inset ring-brand-ring/50 z-10"
            : "hover:bg-ui-bg-secondary",
        )}
      >
        {/* Issue Info */}
        <FlexItem shrink={false} className="w-64 pr-4">
          <Flex align="center" gap="sm" className="mb-1">
            <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="sm" />
            <button
              type="button"
              onClick={() => setSelectedIssue(issue._id)}
              className={cn(
                "text-sm font-medium truncate text-left",
                isSelected ? "text-brand-hover" : "text-ui-text hover:text-brand-muted",
              )}
            >
              {issue.key}
            </button>
          </Flex>
          <Typography variant="caption">{issue.title}</Typography>
        </FlexItem>

        {/* Timeline Bar */}
        <FlexItem flex="1" className="relative h-8">
          {issue.dueDate && (
            <button
              type="button"
              className={cn(
                "absolute h-6 rounded-full opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center px-2",
                getPriorityColor(issue.priority, "bg"),
              )}
              style={{
                left: `${getPositionOnTimeline(issue.dueDate)}%`,
                width: "5%", // Default width for single date
              }}
              onClick={() => setSelectedIssue(issue._id)}
              title={`${issue.title} - Due: ${formatDate(issue.dueDate)}`}
              aria-label={`View issue ${issue.key}`}
            >
              <Typography variant="label" className="text-brand-foreground truncate">
                {issue.assignee?.name.split(" ")[0]}
              </Typography>
            </button>
          )}

          {/* Today Indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-status-error z-10"
            style={{ left: `${getPositionOnTimeline(Date.now())}%` }}
            title="Today"
          />
        </FlexItem>
      </Flex>
    );
  }

  // Loading State
  if (!(project && filteredIssues && epics)) {
    return (
      <PageLayout fullHeight className="overflow-hidden">
        <Flex direction="column" className="h-full">
          {/* Skeleton Header */}
          <Flex align="center" justify="between" className="mb-6 shrink-0">
            <Stack gap="xs">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </Stack>
            <Flex gap="md">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </Flex>
          </Flex>

          {/* Skeleton Timeline */}
          <Card padding="none" className="flex-1 overflow-hidden">
            {/* Skeleton Dates Header */}
            <Card
              variant="soft"
              padding="md"
              radius="none"
              className="shrink-0 border-b border-ui-border"
            >
              <Flex>
                <FlexItem shrink={false} className="w-64">
                  <Skeleton className="h-5 w-24" />
                </FlexItem>
                <FlexItem flex="1" className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((id) => (
                    <Skeleton key={id} className="h-5 w-full" />
                  ))}
                </FlexItem>
              </Flex>
            </Card>

            {/* Skeleton Rows */}
            <Stack className="flex-1 overflow-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Flex align="center" className="border-b border-ui-border" key={i}>
                  <FlexItem shrink={false} className="w-64 pr-4">
                    <Flex align="center" gap="sm">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                    </Flex>
                    <Skeleton className="h-3 w-32" />
                  </FlexItem>
                  <FlexItem flex="1" className="relative h-8">
                    <div
                      className="absolute h-6"
                      style={{
                        left: `${(i * 13) % 70}%`, // Deterministic position
                        width: `${10 + ((i * 3) % 10)}%`,
                      }}
                    >
                      <Skeleton className="h-full w-full rounded-full opacity-50" />
                    </div>
                  </FlexItem>
                </Flex>
              ))}
            </Stack>
          </Card>
        </Flex>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullHeight className="overflow-hidden">
      <Flex direction="column" className="h-full">
        {/* Header */}
        <Flex align="center" justify="between" className="mb-6 shrink-0">
          <Stack gap="xs">
            <Typography variant="h2">Roadmap</Typography>
            <Typography variant="small" color="secondary">
              Visualize issue timeline and dependencies
            </Typography>
          </Stack>

          <Flex gap="md">
            {/* Epic Filter */}
            <Select
              value={filterEpic === "all" ? "all" : filterEpic}
              onValueChange={(value) =>
                setFilterEpic(value === "all" ? "all" : (value as Id<"issues">))
              }
            >
              <SelectTrigger className="px-3 py-2 border border-ui-border rounded-lg bg-ui-bg text-ui-text">
                <SelectValue placeholder="All Epics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Epics</SelectItem>
                {epics?.map((epic: Epic) => (
                  <SelectItem key={epic._id} value={epic._id}>
                    {epic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as "months" | "weeks")}
              size="sm"
            >
              <ToggleGroupItem value="months">Months</ToggleGroupItem>
              <ToggleGroupItem value="weeks">Weeks</ToggleGroupItem>
            </ToggleGroup>
          </Flex>
        </Flex>

        {/* Timeline Container */}
        <Card padding="none" className="flex-1 overflow-hidden">
          {/* Timeline Header (Fixed) */}
          <Card
            variant="soft"
            padding="md"
            radius="none"
            className="shrink-0 border-b border-ui-border"
          >
            <Flex>
              <Typography variant="label" className="w-64 shrink-0">
                Issue
              </Typography>
              <FlexItem flex="1" className="grid grid-cols-6">
                {timelineMonths.map((month) => (
                  <Typography
                    key={month.getTime()}
                    variant="label"
                    className="text-center border-l border-ui-border px-2"
                  >
                    {month.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </Typography>
                ))}
              </FlexItem>
            </Flex>
          </Card>

          {/* Timeline Body (Virtualized) */}
          <FlexItem flex="1">
            {filteredIssues.length === 0 ? (
              <Card padding="xl" className="text-center">
                <Stack gap="xs" align="center">
                  <Typography color="secondary">No issues with due dates to display</Typography>
                  <Typography variant="small" color="secondary">
                    Add due dates to issues to see them on the roadmap
                  </Typography>
                </Stack>
              </Card>
            ) : (
              <List<RowData>
                listRef={listRef}
                style={{ height: 600, width: "100%" }}
                rowCount={filteredIssues.length}
                rowHeight={56}
                rowProps={{ issues: filteredIssues, selectedIndex }}
                rowComponent={Row}
              />
            )}
          </FlexItem>
        </Card>

        {/* Issue Detail Modal */}
        {selectedIssue && (
          <IssueDetailModal
            issueId={selectedIssue}
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedIssue(null);
              }
            }}
            canEdit={canEdit}
          />
        )}
      </Flex>
    </PageLayout>
  );
}
