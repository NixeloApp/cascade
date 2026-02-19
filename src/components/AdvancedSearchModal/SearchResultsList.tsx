import type { Id } from "@convex/_generated/dataModel";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import { getPriorityColor, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Typography } from "../ui/Typography";

interface SearchResult {
  _id: Id<"issues">;
  key: string;
  title: string;
  type: IssueTypeWithSubtask;
  priority: IssuePriority;
}

interface SearchResultsListProps {
  searchQuery: string;
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  onSelectIssue: (issueId: Id<"issues">) => void;
  onLoadMore: () => void;
}

export function SearchResultsList({
  searchQuery,
  results,
  total,
  hasMore,
  onSelectIssue,
  onLoadMore,
}: SearchResultsListProps) {
  if (searchQuery.length < 2) {
    return (
      <Card padding="xl" variant="ghost" className="text-center text-ui-text-tertiary">
        <svg
          aria-hidden="true"
          className="w-16 h-16 mx-auto mb-4 text-ui-text-tertiary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <Typography variant="muted">Start typing to search issues</Typography>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card padding="xl" variant="ghost" className="text-center text-ui-text-tertiary">
        <Typography variant="muted">No issues found matching your criteria</Typography>
      </Card>
    );
  }

  return (
    <>
      <div className="max-h-96 overflow-y-auto divide-y divide-ui-border-secondary">
        {results.map((issue) => (
          <button
            type="button"
            key={issue._id}
            onClick={() => onSelectIssue(issue._id)}
            className="w-full p-4 hover:bg-ui-bg-secondary transition-colors text-left"
          >
            <Flex gap="md" align="start">
              <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="md" className="shrink-0" />
              <FlexItem flex="1" className="min-w-0">
                <Flex gap="sm" align="center" className="mb-1">
                  <Typography variant="inlineCode" color="secondary">
                    {issue.key}
                  </Typography>
                  <Badge size="sm" className={cn(getPriorityColor(issue.priority, "bg"))}>
                    {issue.priority}
                  </Badge>
                </Flex>
                <Typography variant="label">{issue.title}</Typography>
              </FlexItem>
            </Flex>
          </button>
        ))}
      </div>

      {hasMore && (
        <Card
          padding="md"
          radius="none"
          variant="ghost"
          className="border-t border-ui-border bg-ui-bg-secondary"
        >
          <Button variant="secondary" size="sm" onClick={onLoadMore} className="w-full">
            Load More ({total - results.length} remaining)
          </Button>
        </Card>
      )}
    </>
  );
}
