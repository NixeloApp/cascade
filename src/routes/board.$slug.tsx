/**
 * Public Deploy Board Route
 *
 * Public read-only view of a project's issue board.
 * No authentication required — accessed via shareable slug URL.
 */

import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { usePublicQuery } from "@/hooks/useConvexHelpers";
import { formatDate } from "@/lib/formatting";
import { CalendarDays, FolderKanban, User } from "@/lib/icons";

export const Route = createFileRoute("/board/$slug")({
  component: PublicBoardPage,
});

function PublicBoardPage() {
  const { slug } = Route.useParams();
  const board = usePublicQuery(api.deployBoards.getBySlug, { slug });

  if (board === undefined) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  if (board === null) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <EmptyState
          icon={FolderKanban}
          title="Board not found"
          description="This board doesn't exist or has been deactivated."
        />
      </Flex>
    );
  }

  // Group issues by status for column rendering
  const issuesByStatus = new Map<string, typeof board.issues>();
  for (const issue of board.issues) {
    const status = issue.status ?? "unknown";
    const group = issuesByStatus.get(status) ?? [];
    group.push(issue);
    issuesByStatus.set(status, group);
  }

  return (
    <Flex direction="column" className="min-h-screen bg-ui-bg-secondary">
      <Card padding="lg" radius="none" className="border-b border-ui-border">
        <Flex align="center" justify="between">
          <Stack gap="xs">
            <Typography variant="h2">{board.projectName}</Typography>
            <Typography variant="small" color="secondary">
              {board.projectKey} — Public Board
            </Typography>
          </Stack>
          <Badge variant="info" size="sm">
            {board.issues.length} issue{board.issues.length !== 1 ? "s" : ""}
          </Badge>
        </Flex>
      </Card>

      <Flex className="flex-1 overflow-x-auto p-6" gap="lg">
        {board.workflowStates.map((state) => {
          const issues = issuesByStatus.get(state.id) ?? [];
          return (
            <Stack key={state.id} gap="sm" className="w-72 shrink-0">
              <Flex align="center" justify="between">
                <Typography variant="label">{state.name}</Typography>
                <Badge variant="secondary" size="sm">
                  {issues.length}
                </Badge>
              </Flex>
              <Stack gap="xs">
                {issues.map((issue) => (
                  <BoardIssueCard
                    key={issue.key}
                    issue={issue}
                    visibleFields={board.visibleFields}
                  />
                ))}
                {issues.length === 0 && (
                  <Typography variant="caption" color="tertiary" className="text-center py-4">
                    No issues
                  </Typography>
                )}
              </Stack>
            </Stack>
          );
        })}
      </Flex>
    </Flex>
  );
}

type BoardIssue = NonNullable<
  ReturnType<typeof usePublicQuery<typeof api.deployBoards.getBySlug>>
>["issues"][number];
type VisibleFields = NonNullable<
  ReturnType<typeof usePublicQuery<typeof api.deployBoards.getBySlug>>
>["visibleFields"];

function BoardIssueCard({
  issue,
  visibleFields,
}: {
  issue: BoardIssue;
  visibleFields: VisibleFields;
}) {
  return (
    <Card variant="section" padding="sm">
      <Stack gap="xs">
        <Flex align="center" gap="xs">
          <Typography variant="caption" color="secondary">
            {issue.key}
          </Typography>
          {visibleFields.priority && issue.priority && (
            <Badge variant="secondary" size="sm">
              {issue.priority}
            </Badge>
          )}
        </Flex>
        <Typography variant="small">{issue.title}</Typography>
        {visibleFields.labels && issue.labels && issue.labels.length > 0 && (
          <Flex gap="xs" wrap>
            {issue.labels.map((label) => (
              <Badge key={label} variant="outline" size="sm">
                {label}
              </Badge>
            ))}
          </Flex>
        )}
        {(visibleFields.assignee || visibleFields.dueDate) && (
          <Flex align="center" gap="sm">
            {visibleFields.assignee && issue.assigneeName && (
              <Flex align="center" gap="xs">
                <User className="size-3 text-ui-text-tertiary" />
                <Typography variant="caption" color="secondary">
                  {issue.assigneeName}
                </Typography>
              </Flex>
            )}
            {visibleFields.dueDate && issue.dueDate && (
              <Flex align="center" gap="xs">
                <CalendarDays className="size-3 text-ui-text-tertiary" />
                <Typography variant="caption" color="secondary">
                  {formatDate(issue.dueDate)}
                </Typography>
              </Flex>
            )}
          </Flex>
        )}
      </Stack>
    </Card>
  );
}
