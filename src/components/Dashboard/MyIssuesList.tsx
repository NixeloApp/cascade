import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import type { useListNavigation } from "@/hooks/useListNavigation";
import { useOrganization } from "@/hooks/useOrgContext";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { LoadMoreButton } from "../ui/LoadMoreButton";
import { SkeletonList } from "../ui/Skeleton";

type IssueFilter = "assigned" | "created" | "all";

interface Issue {
  _id: Id<"issues">;
  key: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  projectId: Id<"projects">;
  projectKey: string;
  projectName: string;
}

interface MyIssuesListProps {
  myIssues: Issue[] | undefined;
  myCreatedIssues: Issue[] | undefined;
  displayIssues: Issue[] | undefined;
  issueFilter: IssueFilter;
  onFilterChange: (filter: IssueFilter) => void;
  issueNavigation: ReturnType<typeof useListNavigation<Issue>>;
  // Pagination props
  loadMore?: (numItems: number) => void;
  status?: "CanLoadMore" | "LoadingMore" | "Exhausted" | "LoadingFirstPage";
}

/**
 * Dashboard issues list with tabs for assigned/created issues
 */
export function MyIssuesList({
  myIssues,
  myCreatedIssues,
  displayIssues,
  issueFilter,
  onFilterChange,
  issueNavigation,
  loadMore,
  status,
}: MyIssuesListProps) {
  const navigate = useNavigate();
  const { orgSlug } = useOrganization();

  const navigateToWorkspace = (projectKey: string) => {
    navigate({
      to: ROUTES.projects.board.path,
      params: { orgSlug, key: projectKey },
    });
  };

  const navigateToWorkspaces = () => {
    navigate({
      to: ROUTES.workspaces.list.path,
      params: { orgSlug },
    });
  };

  const showLoadMore = issueFilter === "assigned" && status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700">
      <div className="p-6 pb-2">
        <Typography
          variant="h3"
          className="text-xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent"
        >
          Feed
        </Typography>
        <Typography variant="small" color="tertiary" className="text-sm mt-1">
          Track your active contributions
        </Typography>
      </div>
      <Flex
        justify="between"
        align="stretch"
        className="border-b border-ui-border-primary/50 px-4 bg-ui-bg-primary/20"
      >
        <button
          type="button"
          onClick={() => onFilterChange("assigned")}
          className={cn(
            "py-3 px-2 border-b-2 transition-all font-bold text-xs uppercase tracking-wider",
            issueFilter === "assigned"
              ? "border-brand-600 text-brand-600 dark:text-brand-400"
              : "border-transparent text-ui-text-tertiary hover:text-ui-text-primary",
          )}
          aria-label="Filter Assigned"
        >
          Assigned
          <span className="ml-1.5 opacity-60 font-medium">({myIssues?.length || 0})</span>
        </button>
        <button
          type="button"
          onClick={() => onFilterChange("created")}
          className={cn(
            "py-3 px-2 border-b-2 transition-all font-bold text-xs uppercase tracking-wider",
            issueFilter === "created"
              ? "border-brand-600 text-brand-600 dark:text-brand-400"
              : "border-transparent text-ui-text-tertiary hover:text-ui-text-primary",
          )}
          aria-label="Filter Created"
        >
          Created
          <span className="ml-1.5 opacity-60 font-medium">({myCreatedIssues?.length || 0})</span>
        </button>
      </Flex>
      <Flex direction="column" className="p-4 flex-1 overflow-hidden">
        {!displayIssues ? (
          /* Loading skeleton */
          <SkeletonList items={5} />
        ) : displayIssues.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Inbox Clear"
            description="No pending items in your feed."
            action={{
              label: "Explore Projects",
              onClick: navigateToWorkspaces,
            }}
          />
        ) : (
          <Flex
            direction="column"
            gap="xs"
            className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
            ref={issueNavigation.listRef}
          >
            {displayIssues.map((issue, index) => (
              <button
                key={issue._id}
                type="button"
                onClick={() => navigateToWorkspace(issue.projectKey)}
                {...issueNavigation.getItemProps(index)}
                className={cn(
                  "w-full text-left p-3 bg-ui-bg-secondary/20 hover:bg-ui-bg-secondary/40 rounded-lg group cursor-pointer transition-all hover:shadow-sm animate-in fade-in slide-in-from-left-2 duration-500",
                  issueNavigation.getItemProps(index).className,
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Flex justify="between" align="start">
                  <div className="flex-1">
                    <Flex gap="sm" align="center" className="mb-1.5">
                      <Typography
                        variant="small"
                        className="font-mono text-xs text-ui-text-tertiary group-hover:text-brand-600 transition-colors"
                      >
                        {issue.key}
                      </Typography>
                      <Badge
                        variant="neutral"
                        className="text-[10px] uppercase font-bold bg-ui-bg-tertiary/50"
                      >
                        {issue.priority}
                      </Badge>
                    </Flex>
                    <Typography
                      variant="h4"
                      className="font-bold text-ui-text-primary mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors"
                    >
                      {issue.title}
                    </Typography>
                    <Flex
                      gap="xs"
                      align="center"
                      className="text-[10px] text-ui-text-tertiary uppercase tracking-wider font-bold"
                    >
                      <span>{issue.projectName}</span>
                      <span>•</span>
                      <span>{issue.status}</span>
                    </Flex>
                  </div>
                </Flex>
              </button>
            ))}

            {showLoadMore && loadMore && (
              <div className="pt-4">
                <LoadMoreButton
                  onClick={() => loadMore(20)}
                  isLoading={isLoadingMore}
                  className="w-full"
                />
              </div>
            )}
          </Flex>
        )}
      </Flex>
    </div>
  );
}
