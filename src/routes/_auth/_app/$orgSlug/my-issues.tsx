import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/SegmentedControl";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute("/_auth/_app/$orgSlug/my-issues")({
  component: MyIssuesBoardPage,
});

type GroupBy = "status" | "project";

function MyIssuesBoardPage() {
  const { orgSlug } = useOrganization();
  const [groupBy, setGroupBy] = useState<GroupBy>("status");

  // Server-side group counts — always reflect the full dataset
  const groupCounts = useAuthenticatedQuery(api.dashboard.getMyIssueGroupCounts, { groupBy });

  // Paginated issue list — client groups these into columns
  const { results, status, loadMore } = usePaginatedQuery(
    api.dashboard.getMyIssues,
    {},
    { initialNumItems: 100 },
  );

  // Group loaded issues by the selected key
  const issuesByGroup = new Map<string, typeof results>();
  for (const issue of results) {
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
          <SegmentedControl
            value={groupBy}
            onValueChange={(value: string) => value && setGroupBy(value as GroupBy)}
          >
            <SegmentedControlItem value="status">By Status</SegmentedControlItem>
            <SegmentedControlItem value="project">By Project</SegmentedControlItem>
          </SegmentedControl>
        }
      />

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
                  {column.issues.length < column.totalCount
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
                        <Typography variant="small" color="secondary">
                          {issue.key} · {issue.projectKey}
                        </Typography>
                        <Typography variant="label" className="line-clamp-2">
                          {issue.title}
                        </Typography>
                        <Typography variant="caption" color="tertiary">
                          {issue.priority}
                        </Typography>
                      </Stack>
                    </Card>
                  </Link>
                ))}
                {column.issues.length === 0 && (
                  <Typography variant="caption" color="tertiary" className="text-center">
                    No issues loaded
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
