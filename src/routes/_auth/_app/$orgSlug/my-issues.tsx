import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useMemo, useState } from "react";
import { PageContent } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
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

  const groups = useMemo(() => {
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

    return [...grouped.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [groupBy, results]);

  if (status === "LoadingFirstPage") {
    return <PageContent isLoading>{null}</PageContent>;
  }

  return (
    <Flex direction="column" gap="lg">
      <Flex justify="between" align="center" className="flex-wrap gap-3">
        <Typography variant="h2">My Issues Board</Typography>
        <ToggleGroup
          type="single"
          value={groupBy}
          onValueChange={(value) => value && setGroupBy(value as GroupBy)}
          variant="brand"
        >
          <ToggleGroupItem value="status">Group by status</ToggleGroupItem>
          <ToggleGroupItem value="project">Group by project</ToggleGroupItem>
        </ToggleGroup>
      </Flex>

      <Flex gap="md" className="overflow-x-auto pb-2">
        {groups.map(([groupKey, issues]) => (
          <FlexItem
            key={groupKey}
            className="min-w-72 max-w-80 shrink-0 rounded-xl border border-ui-border bg-ui-bg-secondary p-3"
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
                  <div className="rounded-lg border border-ui-border bg-ui-bg p-3 hover:bg-ui-bg-tertiary transition-default">
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
          </FlexItem>
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
