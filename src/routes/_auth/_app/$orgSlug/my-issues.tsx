import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { PageContent } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/SegmentedControl";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute("/_auth/_app/$orgSlug/my-issues")({
  component: MyIssuesBoardPage,
});

type GroupBy = "status" | "project";

function MyIssuesBoardPage() {
  const { orgSlug } = useOrganization();
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const { results, status, loadMore } = usePaginatedQuery(
    api.dashboard.getMyIssues,
    {},
    { initialNumItems: 100 },
  );

  const grouped = new Map<string, typeof results>();
  for (const issue of results) {
    const key = groupBy === "status" ? issue.status : issue.projectKey;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(issue);
    } else {
      grouped.set(key, [issue]);
    }
  }
  const groups = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length);

  if (status === "LoadingFirstPage") {
    return <PageContent isLoading>{null}</PageContent>;
  }

  return (
    <Flex direction="column" gap="lg">
      <Flex justify="between" align="center" wrap className="gap-3">
        <Typography variant="h2">My Issues Board</Typography>
        <SegmentedControl
          value={groupBy}
          onValueChange={(value: string) => value && setGroupBy(value as GroupBy)}
        >
          <SegmentedControlItem value="status">Group by status</SegmentedControlItem>
          <SegmentedControlItem value="project">Group by project</SegmentedControlItem>
        </SegmentedControl>
      </Flex>

      <Flex gap="md" className="overflow-x-auto pb-2">
        {groups.map(([groupKey, issues]) => (
          <Card
            key={groupKey}
            radius="lg"
            padding="sm"
            variant="flat"
            className="min-w-72 max-w-80 shrink-0 border-ui-border bg-ui-bg-secondary"
          >
            <Flex justify="between" align="center" className="mb-3">
              <Typography variant="label">{groupKey}</Typography>
              <Typography variant="small" color="secondary">
                {issues.length}
              </Typography>
            </Flex>
            <Flex direction="column" gap="sm">
              {issues.map((issue) => (
                <Link
                  key={issue._id}
                  to={ROUTES.issues.detail.path}
                  params={{ orgSlug, key: issue.key }}
                >
                  <div className="border border-ui-border bg-ui-bg p-3 hover:bg-ui-bg-tertiary transition-default">
                    <Typography variant="small" color="secondary">
                      {issue.key} · {issue.projectKey}
                    </Typography>
                    <Typography variant="h4" className="line-clamp-2">
                      {issue.title}
                    </Typography>
                    <Typography variant="caption" color="tertiary">
                      {issue.priority}
                    </Typography>
                  </div>
                </Link>
              ))}
            </Flex>
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
    </Flex>
  );
}
