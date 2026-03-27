import { api } from "@convex/_generated/api";
import { WEEK } from "@convex/lib/timeUtils";
import type { ISSUE_PRIORITIES } from "@convex/validators";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardSection } from "@/components/ui/CardSection";
import { Flex } from "@/components/ui/Flex";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/SegmentedControl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatDate } from "@/lib/formatting";
import { ListTodo, SearchX } from "@/lib/icons";
import { getPriorityBadgeTone } from "@/lib/issue-utils";
import {
  getMyIssuesDueDateFilterOptionTestId,
  getMyIssuesPriorityFilterOptionTestId,
  TEST_IDS,
} from "@/lib/test-ids";

export const Route = createFileRoute("/_auth/_app/$orgSlug/my-issues")({
  component: MyIssuesBoardPage,
});

type GroupBy = "status" | "project";
type PriorityFilter = "all" | (typeof ISSUE_PRIORITIES)[number];
type DueDateFilter = "all" | "has-date" | "overdue" | "this-week" | "no-date";

type MyIssueSummary = {
  _id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: number;
  projectKey: string;
};

type MyIssueGroupCount = {
  key: string;
  label: string;
  count: number;
};

type MyIssuesColumn = {
  key: string;
  label: string;
  totalCount: number;
  issues: MyIssueSummary[];
};

const MOBILE_MY_ISSUES_MEDIA_QUERY = "(max-width: 767px)";

const PRIORITY_OPTIONS: { value: PriorityFilter; label: string }[] = [
  { value: "all", label: "All Priorities" },
  { value: "highest", label: "Highest" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "lowest", label: "Lowest" },
];

const DUE_DATE_OPTIONS: { value: DueDateFilter; label: string }[] = [
  { value: "all", label: "All Dates" },
  { value: "overdue", label: "Overdue" },
  { value: "this-week", label: "Due This Week" },
  { value: "has-date", label: "Has Due Date" },
  { value: "no-date", label: "No Due Date" },
];

function matchesDueDateFilter(dueDate: number | undefined, filter: DueDateFilter): boolean {
  if (filter === "all") return true;
  if (filter === "no-date") return dueDate === undefined;
  if (filter === "has-date") return dueDate !== undefined;
  if (dueDate === undefined) return false;
  const now = Date.now();
  if (filter === "overdue") return dueDate < now;
  if (filter === "this-week") return dueDate >= now && dueDate <= now + WEEK;
  return true;
}

function groupIssuesBySelectedKey(
  issues: MyIssueSummary[],
  groupBy: GroupBy,
): Map<string, MyIssueSummary[]> {
  const issuesByGroup = new Map<string, MyIssueSummary[]>();

  for (const issue of issues) {
    const key = groupBy === "status" ? issue.status : issue.projectKey;
    const existing = issuesByGroup.get(key);
    if (existing) {
      existing.push(issue);
    } else {
      issuesByGroup.set(key, [issue]);
    }
  }

  return issuesByGroup;
}

function buildMyIssuesColumns(args: {
  filteredResults: MyIssueSummary[];
  groupBy: GroupBy;
  groupCounts: MyIssueGroupCount[] | undefined;
}): MyIssuesColumn[] {
  const issuesByGroup = groupIssuesBySelectedKey(args.filteredResults, args.groupBy);

  if (args.groupCounts) {
    return args.groupCounts.map((group) => ({
      key: group.key,
      label: group.label,
      totalCount: group.count,
      issues: issuesByGroup.get(group.key) ?? [],
    }));
  }

  return [...issuesByGroup.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([key, issues]) => ({
      key,
      label: key,
      totalCount: issues.length,
      issues,
    }));
}

function filterMyIssuesResults(args: {
  dueDateFilter: DueDateFilter;
  hasActiveFilters: boolean;
  priorityFilter: PriorityFilter;
  results: MyIssueSummary[];
}): MyIssueSummary[] {
  if (!args.hasActiveFilters) {
    return args.results;
  }

  return args.results.filter((issue) => {
    if (args.priorityFilter !== "all" && issue.priority !== args.priorityFilter) {
      return false;
    }

    return matchesDueDateFilter(issue.dueDate, args.dueDateFilter);
  });
}

function formatMyIssuesColumnCount(column: MyIssuesColumn, hasActiveFilters: boolean): string {
  if (hasActiveFilters) {
    return `${column.issues.length} filtered`;
  }

  if (column.issues.length < column.totalCount) {
    return `${column.issues.length} / ${column.totalCount}`;
  }

  return String(column.totalCount);
}

function MobileMyIssuesColumnSelector({
  activeColumnKey,
  columns,
  onChange,
}: {
  activeColumnKey: string | null;
  columns: MyIssuesColumn[];
  onChange: (columnKey: string) => void;
}) {
  if (columns.length <= 1) {
    return null;
  }

  return (
    <SegmentedControl
      data-testid={TEST_IDS.MY_ISSUES.MOBILE_COLUMN_SELECTOR}
      value={activeColumnKey ?? undefined}
      onValueChange={(value) => {
        if (value) {
          onChange(value);
        }
      }}
      variant="outline"
      size="sm"
      width="fill"
      aria-label="My issues columns"
      className="sm:hidden"
    >
      {columns.map((column) => (
        <SegmentedControlItem key={column.key} value={column.key} width="fill" iconSpacing>
          <span className="truncate">{column.label}</span>
          <Badge variant="neutral" size="sm" shape="pill">
            {column.totalCount}
          </Badge>
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}

function useVisibleMyIssuesColumns(args: {
  columns: MyIssuesColumn[];
  isMobileViewport: boolean;
}): {
  activeMobileColumnKey: string | null;
  setActiveMobileColumnKey: (columnKey: string) => void;
  visibleColumns: MyIssuesColumn[];
} {
  const [activeMobileColumnKey, setActiveMobileColumnKey] = useState<string | null>(null);

  useEffect(() => {
    if (!args.isMobileViewport) {
      return;
    }

    if (args.columns.length === 0) {
      setActiveMobileColumnKey((currentColumnKey) => currentColumnKey ?? null);
      return;
    }

    setActiveMobileColumnKey((currentColumnKey) => {
      if (currentColumnKey && args.columns.some((column) => column.key === currentColumnKey)) {
        return currentColumnKey;
      }

      return args.columns[0]?.key ?? null;
    });
  }, [args.columns, args.isMobileViewport]);

  const resolvedMobileColumnKey = activeMobileColumnKey ?? args.columns[0]?.key ?? null;
  const visibleColumns =
    args.isMobileViewport && resolvedMobileColumnKey
      ? args.columns.filter((column) => column.key === resolvedMobileColumnKey)
      : args.columns;

  return {
    activeMobileColumnKey: resolvedMobileColumnKey,
    setActiveMobileColumnKey,
    visibleColumns,
  };
}

/** Personal issue board with client-side filters, grouped columns, and recovery empty states. */
export function MyIssuesBoardPage() {
  const { orgSlug } = useOrganization();
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>("all");
  const isMobileViewport = useMediaQuery(MOBILE_MY_ISSUES_MEDIA_QUERY);

  // Server-side group counts — always reflect the full dataset
  const groupCounts = useAuthenticatedQuery(api.dashboard.getMyIssueGroupCounts, { groupBy });

  // Paginated issue list — client groups these into columns
  const { results, status, loadMore } = usePaginatedQuery(
    api.dashboard.getMyIssues,
    {},
    { initialNumItems: 100 },
  );

  const hasActiveFilters = priorityFilter !== "all" || dueDateFilter !== "all";
  const isLoading = status === "LoadingFirstPage";

  // Apply client-side filters
  const filteredResults = useMemo(() => {
    return filterMyIssuesResults({
      dueDateFilter,
      hasActiveFilters,
      priorityFilter,
      results,
    });
  }, [results, priorityFilter, dueDateFilter, hasActiveFilters]);

  const columns = useMemo(
    () =>
      buildMyIssuesColumns({
        filteredResults,
        groupBy,
        groupCounts,
      }),
    [filteredResults, groupBy, groupCounts],
  );
  const { activeMobileColumnKey, setActiveMobileColumnKey, visibleColumns } =
    useVisibleMyIssuesColumns({
      columns,
      isMobileViewport,
    });

  const hasLoadedIssues = results.length > 0 || (groupCounts?.length ?? 0) > 0;
  const showEmptyState = !hasLoadedIssues;
  const showFilteredEmptyState =
    hasActiveFilters && filteredResults.length === 0 && hasLoadedIssues;
  const resetFilters = () => {
    setPriorityFilter("all");
    setDueDateFilter("all");
  };

  if (isLoading) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  return (
    <PageLayout>
      <PageHeader
        title="My Issues"
        actions={
          <Flex gap="sm" align="center" wrap>
            <Select
              value={priorityFilter}
              onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}
            >
              <SelectTrigger
                width="sm"
                aria-label="My issues priority filter"
                data-testid={TEST_IDS.MY_ISSUES.PRIORITY_FILTER}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    data-testid={getMyIssuesPriorityFilterOptionTestId(opt.value)}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={dueDateFilter}
              onValueChange={(v) => setDueDateFilter(v as DueDateFilter)}
            >
              <SelectTrigger
                width="sm"
                aria-label="My issues due date filter"
                data-testid={TEST_IDS.MY_ISSUES.DUE_DATE_FILTER}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DUE_DATE_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    data-testid={getMyIssuesDueDateFilterOptionTestId(opt.value)}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            )}

            <SegmentedControl
              data-testid={TEST_IDS.MY_ISSUES.GROUP_BY_CONTROL}
              value={groupBy}
              onValueChange={(value: string) => value && setGroupBy(value as GroupBy)}
            >
              <SegmentedControlItem value="status">By Status</SegmentedControlItem>
              <SegmentedControlItem value="project">By Project</SegmentedControlItem>
            </SegmentedControl>
          </Flex>
        }
      />

      {showEmptyState ? (
        <PageContent
          emptyState={{
            icon: ListTodo,
            title: "No issues assigned to you yet",
            description:
              "Assigned work from your projects will show up here so you can scan it by status or project.",
          }}
        >
          {null}
        </PageContent>
      ) : showFilteredEmptyState ? (
        <PageContent
          emptyState={{
            icon: SearchX,
            title: "No issues match these filters",
            description:
              "Try another priority or due-date combination, or clear the current filters to see the rest of your work.",
            actions: (
              <Button type="button" onClick={resetFilters}>
                Clear filters
              </Button>
            ),
          }}
        >
          {null}
        </PageContent>
      ) : (
        <PageContent className="space-y-3">
          {hasActiveFilters && (
            <Typography
              variant="caption"
              color="tertiary"
              data-testid={TEST_IDS.MY_ISSUES.FILTER_SUMMARY}
            >
              Showing {filteredResults.length} of {results.length} loaded issues
            </Typography>
          )}

          <Stack gap="md" data-testid={TEST_IDS.MY_ISSUES.CONTENT}>
            {isMobileViewport ? (
              <MobileMyIssuesColumnSelector
                activeColumnKey={activeMobileColumnKey}
                columns={columns}
                onChange={setActiveMobileColumnKey}
              />
            ) : null}

            <Flex gap="md" className="overflow-x-auto pb-2 sm:pb-2">
              {visibleColumns.map((column) => (
                <Card
                  key={column.key}
                  radius="lg"
                  padding="sm"
                  variant="flat"
                  data-testid={TEST_IDS.MY_ISSUES.COLUMN}
                  className="w-full min-w-0 border-ui-border bg-ui-bg-secondary sm:min-w-72 sm:max-w-80 sm:shrink-0"
                >
                  <Stack gap="md">
                    <Flex justify="between" align="center">
                      <Typography variant="label">{column.label}</Typography>
                      <Badge variant="neutral" size="sm">
                        {formatMyIssuesColumnCount(column, hasActiveFilters)}
                      </Badge>
                    </Flex>
                    <Stack gap="sm">
                      {column.issues.map((issue) => (
                        <Link
                          key={issue._id}
                          to={ROUTES.issues.detail.path}
                          params={{ orgSlug, key: issue.key }}
                        >
                          <CardSection size="compact" hoverable>
                            <Stack gap="xs">
                              <Flex justify="between" align="center">
                                <Typography variant="small" color="secondary">
                                  {issue.key} · {issue.projectKey}
                                </Typography>
                                {issue.dueDate && (
                                  <Badge
                                    variant={issue.dueDate < Date.now() ? "error" : "neutral"}
                                    size="sm"
                                  >
                                    {formatDate(issue.dueDate, { month: "short", day: "numeric" })}
                                  </Badge>
                                )}
                              </Flex>
                              <Typography variant="label" className="line-clamp-2">
                                {issue.title}
                              </Typography>
                              <Badge
                                size="sm"
                                shape="pill"
                                priorityTone={getPriorityBadgeTone(issue.priority)}
                              >
                                {issue.priority}
                              </Badge>
                            </Stack>
                          </CardSection>
                        </Link>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Flex>
          </Stack>

          {status === "CanLoadMore" && (
            <Flex justify="center">
              <Button onClick={() => loadMore(100)} variant="secondary">
                Load more
              </Button>
            </Flex>
          )}
        </PageContent>
      )}
    </PageLayout>
  );
}
