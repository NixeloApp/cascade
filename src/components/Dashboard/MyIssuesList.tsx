/**
 * My Issues List
 *
 * Dashboard widget showing user's assigned and created issues.
 * Supports filtering by assignment status with paginated results.
 * Navigates to issue detail on selection.
 */

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
    <Flex direction="column" className="h-full min-w-0">
      <Card
        padding="lg"
        radius="none"
        variant="ghost"
        className="border-b border-ui-border/50 pb-3"
      >
        <Flex justify="between" align="end" gap="md" wrap>
          <Stack gap="xs">
            <Typography variant="h3" data-testid={TEST_IDS.DASHBOARD.FEED_HEADING}>
              Active feed
            </Typography>
            <Typography variant="small" color="tertiary" className="max-w-xl">
              Assigned and created issues stay in one queue so you can triage without hopping
              between views.
            </Typography>
          </Stack>
          <Badge variant="neutral" shape="pill">
            Live queue
          </Badge>
        </Flex>
      </Card>
      <Tabs
        value={issueFilter}
        onValueChange={(value) => onFilterChange(value as IssueFilter)}
        className="border-b border-ui-border/50 bg-ui-bg/20"
      >
        <TabsList variant="underline" className="gap-6 px-4">
          <TabsTrigger value="assigned" variant="underline" size="eyebrow">
            Assigned
            <Typography variant="label" as="span" className="ml-1.5 opacity-60">
              ({myIssues?.length || 0})
            </Typography>
          </TabsTrigger>
          <TabsTrigger value="created" variant="underline" size="eyebrow">
            Created
            <Typography variant="label" as="span" className="ml-1.5 opacity-60">
              ({myCreatedIssues?.length || 0})
            </Typography>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <FlexItem flex="1" className="overflow-hidden p-4">
        <Flex direction="column" className="h-full">
          {!displayIssues ? (
            /* Loading skeleton */
            <SkeletonList items={5} />
          ) : displayIssues.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Inbox Clear"
              description="No pending items in your feed."
              size="compact"
              action={{
                label: "Explore Projects",
                onClick: navigateToWorkspaces,
              }}
            />
          ) : (
            <FlexItem
              flex="1"
              className="overflow-y-auto pr-2 scrollbar-subtle"
              ref={issueNavigation.listRef}
            >
              <Flex direction="column" gap="xs">
                {displayIssues.map((issue, index) => {
                  const itemProps = issueNavigation.getItemProps(index);

                  return (
                    <Card
                      key={issue._id}
                      onClick={() => navigateToWorkspace(issue.projectKey)}
                      hoverable
                      variant="outline"
                      padding="md"
                      {...itemProps}
                      className={cn("bg-ui-bg-soft/60 text-left shadow-soft", itemProps.className)}
                    >
                      <Flex justify="between" align="start">
                        <FlexItem flex="1">
                          <Flex gap="sm" align="center" wrap className="mb-2">
                            <Typography variant="inlineCode" color="tertiary">
                              {issue.key}
                            </Typography>
                            <Badge variant="dashboardTag" size="emphasis">
                              {issue.priority}
                            </Badge>
                          </Flex>
                          <Typography variant="cardTitle" className="mb-2">
                            {issue.title}
                          </Typography>
                          <Metadata size="xs" gap="xs" className="uppercase tracking-widest">
                            <MetadataItem>{issue.projectName}</MetadataItem>
                            <MetadataItem>{issue.status}</MetadataItem>
                          </Metadata>
                        </FlexItem>
                      </Flex>
                    </Card>
                  );
                })}

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
            </FlexItem>
          )}
        </Flex>
      </FlexItem>
    </Flex>
  );
}
