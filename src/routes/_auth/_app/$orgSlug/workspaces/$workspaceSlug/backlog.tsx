import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContent } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
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
import { SearchX } from "@/lib/icons";
import { getPriorityBadgeTone, getStatusBadgeTone, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { useWorkspaceLayout } from "./route";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/backlog")({
  component: WorkspaceBacklogPage,
});

type BacklogIssue = Doc<"issues">;
type PriorityFilter = "all" | "highest" | "high" | "medium" | "low" | "lowest";
type SortField = "priority" | "updated" | "created";

const PRIORITY_ORDER: Record<string, number> = {
  highest: 0,
  high: 1,
  medium: 2,
  low: 3,
  lowest: 4,
};

function sortIssues(issues: BacklogIssue[], sortBy: SortField): BacklogIssue[] {
  return [...issues].sort((a, b) => {
    if (sortBy === "priority") {
      return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    }
    if (sortBy === "updated") {
      return (b.updatedAt ?? b._creationTime) - (a.updatedAt ?? a._creationTime);
    }
    return b._creationTime - a._creationTime;
  });
}

function BacklogIssueRow({ issue, orgSlug }: { issue: BacklogIssue; orgSlug: string }) {
  return (
    <Link to={ROUTES.issues.detail.path} params={{ orgSlug, key: issue.key }}>
      <Card hoverable padding="md">
        <Flex justify="between" align="center" gap="md">
          <Flex align="center" gap="sm" className="min-w-0">
            <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="sm" className="shrink-0" />
            <Typography variant="small" color="tertiary" className="shrink-0">
              {issue.key}
            </Typography>
            <Typography variant="label" className="truncate">
              {issue.title}
            </Typography>
          </Flex>
          <Flex gap="xs" className="shrink-0">
            <Badge shape="pill" statusTone={getStatusBadgeTone(issue.status)}>
              {issue.status}
            </Badge>
            <Badge shape="pill" priorityTone={getPriorityBadgeTone(issue.priority)}>
              {issue.priority}
            </Badge>
          </Flex>
        </Flex>
      </Card>
    </Link>
  );
}

function WorkspaceBacklogPage() {
  const { orgSlug } = useOrganization();
  const { workspaceId } = useWorkspaceLayout();
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [sortBy, setSortBy] = useState<SortField>("priority");

  const backlogIssues = useAuthenticatedQuery(api.workspaces.getBacklogIssues, { workspaceId });

  const filteredAndSorted = useMemo(() => {
    if (!backlogIssues) return [];
    const filtered =
      priorityFilter === "all"
        ? backlogIssues
        : backlogIssues.filter((issue) => issue.priority === priorityFilter);
    return sortIssues(filtered, sortBy);
  }, [backlogIssues, priorityFilter, sortBy]);

  if (backlogIssues === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  return (
    <PageContent
      isEmpty={backlogIssues.length === 0}
      emptyState={{
        icon: SearchX,
        title: "Backlog is empty",
        description: "No unsprinted workspace issues are currently in backlog.",
      }}
    >
      <Stack gap="md">
        <Flex justify="between" align="center" gap="sm">
          <Typography variant="small" color="secondary">
            {filteredAndSorted.length} {filteredAndSorted.length === 1 ? "issue" : "issues"}
            {priorityFilter !== "all" ? ` (${priorityFilter})` : ""}
          </Typography>
          <Flex gap="sm">
            <Select
              value={priorityFilter}
              onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}
            >
              <SelectTrigger width="sm" aria-label="Filter by priority">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="highest">Highest</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="lowest">Lowest</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
              <SelectTrigger width="sm" aria-label="Sort by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="updated">Last updated</SelectItem>
                <SelectItem value="created">Newest first</SelectItem>
              </SelectContent>
            </Select>
          </Flex>
        </Flex>

        {filteredAndSorted.length === 0 && backlogIssues.length > 0 ? (
          <Typography variant="small" color="tertiary" className="text-center py-8">
            No issues match the current filter.
          </Typography>
        ) : (
          <Stack gap="xs">
            {filteredAndSorted.map((issue) => (
              <BacklogIssueRow key={issue._id} issue={issue} orgSlug={orgSlug} />
            ))}
          </Stack>
        )}
      </Stack>
    </PageContent>
  );
}
