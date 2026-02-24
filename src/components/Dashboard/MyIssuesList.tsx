import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import type { useListNavigation } from "@/hooks/useListNavigation";
import { useOrganization } from "@/hooks/useOrgContext";
import { Inbox } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { LoadMoreButton } from "../ui/LoadMoreButton";
import { Metadata, MetadataItem } from "../ui/Metadata";
import { SkeletonList } from "../ui/Skeleton";
import { Stack } from "../ui/Stack";
import { Tabs, TabsList, TabsTrigger } from "../ui/Tabs";

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
    <Flex direction="column" className="h-full">
      <Card padding="lg" radius="none" variant="ghost" className="pb-2">
        <Stack gap="xs">
          <Typography variant="h3" data-testid={TEST_IDS.DASHBOARD.FEED_HEADING}>
            Feed
          </Typography>
          <Typography variant="small" color="tertiary">
            Track your active contributions
          </Typography>
        </Stack>
      </Card>
      <Tabs
        value={issueFilter}
        onValueChange={(value) => onFilterChange(value as IssueFilter)}
        className="border-b border-ui-border/50 bg-ui-bg/20"
      >
        <TabsList variant="underline" className="px-4 gap-4">
          <TabsTrigger
            value="assigned"
            variant="underline"
            className="py-3 px-2 font-bold text-xs uppercase tracking-wider text-ui-text-tertiary"
          >
            Assigned
            <Typography variant="label" as="span" className="ml-1.5 opacity-60">
              ({myIssues?.length || 0})
            </Typography>
          </TabsTrigger>
          <TabsTrigger
            value="created"
            variant="underline"
            className="py-3 px-2 font-bold text-xs uppercase tracking-wider text-ui-text-tertiary"
          >
            Created
            <Typography variant="label" as="span" className="ml-1.5 opacity-60">
              ({myCreatedIssues?.length || 0})
            </Typography>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Card padding="md" radius="none" variant="ghost" className="flex-1 overflow-hidden">
        <Flex direction="column" className="h-full">
          {!displayIssues ? (
            /* Loading skeleton */
            <SkeletonList items={5} />
          ) : displayIssues.length === 0 ? (
            <EmptyState
              icon={Inbox}
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
                <Button
                  key={issue._id}
                  variant="unstyled"
                  onClick={() => navigateToWorkspace(issue.projectKey)}
                  {...issueNavigation.getItemProps(index)}
                  className={cn(
                    "w-full text-left p-3 bg-ui-bg-secondary/20 hover:bg-ui-bg-secondary/40 rounded-lg group cursor-pointer transition-colors h-auto",
                    issueNavigation.getItemProps(index).className,
                  )}
                >
                  <Flex justify="between" align="start">
                    <FlexItem flex="1">
                      <Flex gap="sm" align="center" className="mb-1.5">
                        <Typography
                          variant="inlineCode"
                          color="tertiary"
                          className="group-hover:text-brand transition-colors"
                        >
                          {issue.key}
                        </Typography>
                        <Badge
                          variant="neutral"
                          className="text-xs uppercase font-bold bg-ui-bg-tertiary/50"
                        >
                          {issue.priority}
                        </Badge>
                      </Flex>
                      <Typography
                        variant="label"
                        className="mb-1 group-hover:text-brand transition-colors"
                      >
                        {issue.title}
                      </Typography>
                      <Metadata size="xs" gap="xs" className="uppercase tracking-wider">
                        <MetadataItem>{issue.projectName}</MetadataItem>
                        <MetadataItem>{issue.status}</MetadataItem>
                      </Metadata>
                    </FlexItem>
                  </Flex>
                </Button>
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
      </Card>
    </Flex>
  );
}
