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
import { getPriorityBadgeTone } from "@/lib/issue-utils";

export const Route = createFileRoute("/_auth/_app/$orgSlug/my-issues")({
  component: MyIssuesBoardPage,
});

type GroupBy = "status" | "project";
type PriorityFilter = "all" | (typeof ISSUE_PRIORITIES)[number];
type DueDateFilter = "all" | "has-date" | "overdue" | "this-week" | "no-date";

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

function MyIssuesBoardPage() {
  const { orgSlug } = useOrganization();
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>("all");

  // Server-side group counts — always reflect the full dataset
  const groupCounts = useAuthenticatedQuery(api.dashboard.getMyIssueGroupCounts, { groupBy });

  // Paginated issue list — client groups these into columns
  const { results, status, loadMore } = usePaginatedQuery(
    api.dashboard.getMyIssues,
    {},
    { initialNumItems: 100 },
  );

  const hasActiveFilters = priorityFilter !== "all" || dueDateFilter !== "all";

  // Apply client-side filters
  const filteredResults = useMemo(() => {
    if (!hasActiveFilters) return results;
    return results.filter((issue) => {
      if (priorityFilter !== "all" && issue.priority !== priorityFilter) return false;
      if (!matchesDueDateFilter(issue.dueDate, dueDateFilter)) return false;
      return true;
    });
  }, [results, priorityFilter, dueDateFilter, hasActiveFilters]);

  // Group filtered issues by the selected key
  const issuesByGroup = new Map<string, typeof filteredResults>();
  for (const issue of filteredResults) {
    const key = groupBy === "status" ? issue.status : issue.projectKey;
    const existing = issuesByGroup.get(key);
    if (existing) {
      existing.push(issue);
    } else {
      issuesByGroup.set(key, [issue]);
    }
  }

  if (status === "LoadingFirstPage") {
    return <PageContent isLoading>{null}</PageContent>;
  }

  // Use server counts for column order and totals, fall back to client counts
  const columns = groupCounts
    ? groupCounts.map((group) => ({
        key: group.key,
        label: group.label,
        totalCount: group.count,
        issues: issuesByGroup.get(group.key) ?? [],
      }))
    : [...issuesByGroup.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .map(([key, issues]) => ({
          key,
          label: key,
          totalCount: issues.length,
          issues,
        }));

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
              <SelectTrigger className="w-36">
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
              <SelectTrigger className="w-36">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPriorityFilter("all");
                  setDueDateFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}

            <SegmentedControl
              value={groupBy}
              onValueChange={(value: string) => value && setGroupBy(value as GroupBy)}
            >
              <SegmentedControlItem value="status">By Status</SegmentedControlItem>
              <SegmentedControlItem value="project">By Project</SegmentedControlItem>
            </SegmentedControl>
          </Flex>
        }
      />

      {hasActiveFilters && (
        <Typography variant="caption" color="tertiary">
          Showing {filteredResults.length} of {results.length} loaded issues
        </Typography>
      )}

      <Flex gap="md" className="overflow-x-auto pb-2">
        {columns.map((column) => (
          <Card
            key={column.key}
            radius="lg"
            padding="sm"
            variant="flat"
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
                    <Card variant="section" padding="sm" hoverable>
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
                    </Card>
                  </Link>
                ))}
                {column.issues.length === 0 && (
                  <Typography variant="caption" color="tertiary" className="text-center">
                    {hasActiveFilters ? "No matching issues" : "No issues loaded"}
                  </Typography>
                )}
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
    </PageLayout>
  );
}
