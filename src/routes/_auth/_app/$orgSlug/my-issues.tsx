import { api } from "@convex/_generated/api";
import { WEEK } from "@convex/lib/timeUtils";
import type { ISSUE_PRIORITIES } from "@convex/validators";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useMemo, useState } from "react";
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
import { useOrganization } from "@/hooks/useOrgContext";
import { formatDate } from "@/lib/formatting";
import { ListTodo, SearchX } from "@/lib/icons";
import { getPriorityBadgeTone } from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";

export const Route = createFileRoute("/_auth/_app/$orgSlug/my-issues")({
  component: MyIssuesBoardPage,
});

declare global {
  interface Window {
    __NIXELO_E2E_MY_ISSUES_LOADING__?: boolean;
  }
}

type GroupBy = "status" | "project";
type PriorityFilter = "all" | (typeof ISSUE_PRIORITIES)[number];
type DueDateFilter = "all" | "has-date" | "overdue" | "this-week" | "no-date";
type MyIssuesE2EState = "filtered-empty";

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

type MyIssuesInitialState = {
  dueDateFilter: DueDateFilter;
  forceFilteredEmpty: boolean;
  groupBy: GroupBy;
  priorityFilter: PriorityFilter;
};

const MY_ISSUES_E2E_STATE_STORAGE_KEY = "nixelo:e2e:my-issues-state";

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

function isE2EMyIssuesLoadingOverrideEnabled(): boolean {
  return typeof window !== "undefined" && window.__NIXELO_E2E_MY_ISSUES_LOADING__ === true;
}

function consumeMyIssuesE2ERequestedState(): MyIssuesInitialState {
  const defaultState: MyIssuesInitialState = {
    dueDateFilter: "all",
    forceFilteredEmpty: false,
    groupBy: "status",
    priorityFilter: "all",
  };

  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const requestedState = window.sessionStorage.getItem(MY_ISSUES_E2E_STATE_STORAGE_KEY);
    window.sessionStorage.removeItem(MY_ISSUES_E2E_STATE_STORAGE_KEY);
    if ((requestedState as MyIssuesE2EState | null) === "filtered-empty") {
      return {
        dueDateFilter: "all",
        forceFilteredEmpty: true,
        groupBy: "status",
        priorityFilter: "lowest",
      };
    }
  } catch {
    return defaultState;
  }

  return defaultState;
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

/** Personal issue board with client-side filters, grouped columns, and recovery empty states. */
export function MyIssuesBoardPage() {
  const { orgSlug } = useOrganization();
  const [initialState] = useState(consumeMyIssuesE2ERequestedState);
  const [groupBy, setGroupBy] = useState<GroupBy>(initialState.groupBy);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>(initialState.priorityFilter);
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>(initialState.dueDateFilter);

  // Server-side group counts — always reflect the full dataset
  const groupCounts = useAuthenticatedQuery(api.dashboard.getMyIssueGroupCounts, { groupBy });

  // Paginated issue list — client groups these into columns
  const { results, status, loadMore } = usePaginatedQuery(
    api.dashboard.getMyIssues,
    {},
    { initialNumItems: 100 },
  );

  const hasActiveFilters = priorityFilter !== "all" || dueDateFilter !== "all";
  const isLoading = isE2EMyIssuesLoadingOverrideEnabled() || status === "LoadingFirstPage";

  // Apply client-side filters
  const filteredResults = useMemo(() => {
    if (initialState.forceFilteredEmpty && hasActiveFilters) {
      return [];
    }
    if (!hasActiveFilters) return results;
    return results.filter((issue) => {
      if (priorityFilter !== "all" && issue.priority !== priorityFilter) return false;
      if (!matchesDueDateFilter(issue.dueDate, dueDateFilter)) return false;
      return true;
    });
  }, [results, priorityFilter, dueDateFilter, hasActiveFilters, initialState.forceFilteredEmpty]);

  const columns = useMemo(
    () =>
      buildMyIssuesColumns({
        filteredResults,
        groupBy,
        groupCounts,
      }),
    [filteredResults, groupBy, groupCounts],
  );
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
                  <SelectItem key={opt.value} value={opt.value}>
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
                  <SelectItem key={opt.value} value={opt.value}>
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
          isEmpty
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
          isEmpty
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

          <Flex gap="md" className="overflow-x-auto pb-2" data-testid={TEST_IDS.MY_ISSUES.CONTENT}>
            {columns.map((column) => (
              <Card
                key={column.key}
                radius="lg"
                padding="sm"
                variant="flat"
                data-testid={TEST_IDS.MY_ISSUES.COLUMN}
                className="min-w-72 max-w-80 shrink-0 border-ui-border bg-ui-bg-secondary"
              >
                <Stack gap="md">
                  <Flex justify="between" align="center">
                    <Typography variant="label">{column.label}</Typography>
                    <Badge variant="neutral" size="sm">
                      {hasActiveFilters
                        ? `${column.issues.length} filtered`
                        : column.issues.length < column.totalCount
                          ? `${column.issues.length} / ${column.totalCount}`
                          : String(column.totalCount)}
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
