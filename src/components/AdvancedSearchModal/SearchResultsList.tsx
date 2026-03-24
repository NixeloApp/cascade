import type { Id } from "@convex/_generated/dataModel";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import { Search } from "@/lib/icons";
import { getPriorityColor, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface SearchResult {
  _id: Id<"issues">;
  key: string;
  title: string;
  type: IssueTypeWithSubtask;
  priority: IssuePriority;
  projectId: Id<"projects">;
}

interface SearchResultsListProps {
  searchQuery: string;
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  onSelectIssue: (issueKey: string) => void;
  onLoadMore: () => void;
}

/**
 * Paginated list of search results with issue cards and load more.
 */
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
      <EmptyState
        icon={Search}
        title="Start typing to search"
        description="Search issues by title, key, or description."
        size="compact"
        surface="bare"
      />
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No matching issues"
        description="Try a broader query or clear one of the filters."
        size="compact"
        surface="bare"
      />
    );
  }

  return (
    <Stack gap="none">
      {/* Results list - let parent Dialog handle scrolling */}
      <Stack gap="none">
        {results.map((issue) => (
          <Card
            recipe="searchResultRow"
            key={issue._id}
            padding="md"
            radius="none"
            onClick={() => onSelectIssue(issue.key)}
            className="w-full text-left"
            aria-label={`${issue.key} ${issue.title}`}
          >
            <Flex gap="md" align="start">
              <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="md" className="shrink-0" />
              <FlexItem flex="1" className="min-w-0">
                <Stack gap="xs">
                  <Flex gap="sm" align="center">
                    <Typography variant="inlineCode" color="secondary">
                      {issue.key}
                    </Typography>
                    <Badge size="sm" className={cn(getPriorityColor(issue.priority, "bg"))}>
                      {issue.priority}
                    </Badge>
                  </Flex>
                  <Typography variant="label">{issue.title}</Typography>
                </Stack>
              </FlexItem>
            </Flex>
          </Card>
        ))}
      </Stack>

      {hasMore && (
        <Card recipe="listFooterBar" padding="md" radius="none">
          <Button variant="secondary" size="sm" onClick={onLoadMore} className="w-full">
            Load More ({total - results.length} remaining)
          </Button>
        </Card>
      )}
    </Stack>
  );
}
