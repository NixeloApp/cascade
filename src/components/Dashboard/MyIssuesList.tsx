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
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { LoadMoreButton } from "../ui/LoadMoreButton";
import { Metadata, MetadataItem } from "../ui/Metadata";
import { SkeletonList } from "../ui/Skeleton";
import { Stack } from "../ui/Stack";
import { Tabs, TabsList, TabsTrigger } from "../ui/Tabs";
import {
  DashboardPanel,
  DashboardPanelBody,
  DashboardPanelFooter,
  DashboardPanelHeader,
} from "./DashboardPanel";

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
    <DashboardPanel className="h-full">
      <DashboardPanelHeader
        title={
          <Typography variant="h3" data-testid={TEST_IDS.DASHBOARD.FEED_HEADING}>
            Active feed
          </Typography>
        }
        description="Assigned and created issues stay in one queue so you can triage without hopping between views."
        badge={
          <Badge variant="neutral" shape="pill">
            Live queue
          </Badge>
        }
        controls={
          <Tabs value={issueFilter} onValueChange={(value) => onFilterChange(value as IssueFilter)}>
            <TabsList variant="pill" size="compact" aria-label="Issue feed filter">
              <TabsTrigger value="assigned" size="compact">
                <Flex align="center" gap="xs">
                  <Typography as="span" variant="label">
                    Assigned
                  </Typography>
                  <Typography as="span" variant="label" color="tertiary">
                    ({myIssues?.length || 0})
                  </Typography>
                </Flex>
              </TabsTrigger>
              <TabsTrigger value="created" size="compact">
                <Flex align="center" gap="xs">
                  <Typography as="span" variant="label">
                    Created
                  </Typography>
                  <Typography as="span" variant="label" color="tertiary">
                    ({myCreatedIssues?.length || 0})
                  </Typography>
                </Flex>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <DashboardPanelBody padding="md" grow className="overflow-hidden">
        {!displayIssues ? (
          <SkeletonList items={5} />
        ) : displayIssues.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Inbox Clear"
            description="No pending items in your feed."
            size="compact"
            surface="bare"
            action={{
              label: "Explore Projects",
              onClick: navigateToWorkspaces,
            }}
          />
        ) : (
          <Flex
            direction="column"
            gap="xs"
            className="overflow-y-auto pr-2 scrollbar-subtle"
            ref={issueNavigation.listRef}
          >
            {displayIssues.map((issue, index) => {
              const itemProps = issueNavigation.getItemProps(index);

              return (
                <Button
                  key={issue._id}
                  variant="unstyled"
                  chrome="listRow"
                  chromeSize="listRow"
                  onClick={() => navigateToWorkspace(issue.projectKey)}
                  {...itemProps}
                  className={cn(itemProps.className)}
                >
                  <Stack gap="xs">
                    <Flex gap="sm" align="center" wrap>
                      <Typography variant="inlineCode" color="tertiary">
                        {issue.key}
                      </Typography>
                      <Badge variant="dashboardTag" size="emphasis">
                        {issue.priority}
                      </Badge>
                    </Flex>
                    <Typography variant="cardTitle">{issue.title}</Typography>
                    <Metadata size="xs" gap="xs">
                      <MetadataItem>{issue.projectName}</MetadataItem>
                      <MetadataItem>{issue.status}</MetadataItem>
                    </Metadata>
                  </Stack>
                </Button>
              );
            })}
          </Flex>
        )}
      </DashboardPanelBody>

      {showLoadMore && loadMore ? (
        <DashboardPanelFooter>
          <LoadMoreButton
            onClick={() => loadMore(20)}
            isLoading={isLoadingMore}
            className="w-full"
          />
        </DashboardPanelFooter>
      ) : null}
    </DashboardPanel>
  );
}
