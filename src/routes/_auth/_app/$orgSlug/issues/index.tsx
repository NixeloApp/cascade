import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ISSUE_PRIORITIES, ISSUE_TYPES } from "@convex/validators";
import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useDeferredValue, useState } from "react";
import { CreateIssueModal, IssueCard } from "@/components/IssueDetail";
import { IssueDetailViewer } from "@/components/IssueDetailViewer";
import { ViewModeToggle } from "@/components/Kanban/ViewModeToggle";
import {
  PageContent,
  PageControls,
  PageControlsGroup,
  PageControlsRow,
  PageHeader,
  PageLayout,
  PageStack,
} from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { Plus, SearchX, X } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";

export const Route = createFileRoute("/_auth/_app/$orgSlug/issues/")({
  component: AllIssuesPage,
});

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  ...ISSUE_PRIORITIES.map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) })),
];

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  ...ISSUE_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
];

// =============================================================================
// Filter Hook
// =============================================================================

function useIssueFilters() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const deferredSearch = useDeferredValue(searchQuery.trim());
  const isSearching = !!deferredSearch;
  const hasActiveFilters = !!(statusFilter || priorityFilter || typeFilter || deferredSearch);

  const clearAll = () => {
    setStatusFilter(undefined);
    setPriorityFilter(undefined);
    setTypeFilter(undefined);
    setSearchQuery("");
  };

  return {
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    deferredSearch,
    isSearching,
    hasActiveFilters,
    clearAll,
  };
}

function useIssueResults(
  organizationId: Id<"organizations"> | null,
  filters: ReturnType<typeof useIssueFilters>,
) {
  const statusOptions = useAuthenticatedQuery(
    api.projects.getOrganizationWorkflowStates,
    organizationId ? { organizationId } : "skip",
  );

  const paginatedQueryArgs =
    organizationId && !filters.isSearching
      ? {
          organizationId,
          status: filters.statusFilter,
          priority: filters.priorityFilter,
          type: filters.typeFilter,
        }
      : "skip";

  const searchQueryArgs =
    organizationId && filters.isSearching
      ? {
          organizationId,
          query: filters.deferredSearch,
          status: filters.statusFilter,
          priority: filters.priorityFilter,
          type: filters.typeFilter,
        }
      : "skip";

  const {
    results: paginatedIssues,
    status,
    loadMore,
  } = usePaginatedQuery(api.issues.listOrganizationIssues, paginatedQueryArgs, {
    initialNumItems: 20,
  });

  const searchResults = useAuthenticatedQuery(api.issues.searchOrganizationIssues, searchQueryArgs);
  const isLoading = filters.isSearching
    ? searchResults === undefined
    : status === "LoadingFirstPage";

  return {
    filteredIssues: filters.isSearching ? (searchResults ?? []) : paginatedIssues,
    isLoading,
    loadMore,
    status,
    statusOptions: statusOptions ?? [],
  };
}

// =============================================================================
// Filter Bar
// =============================================================================

function IssueFilterBar({
  filters,
  statusOptions,
}: {
  filters: ReturnType<typeof useIssueFilters>;
  statusOptions: Array<{ id: string; name: string }>;
}) {
  return (
    <PageControls spacing="stack">
      <PageControlsRow>
        <FlexItem flex="1">
          <Input
            data-testid={TEST_IDS.ISSUE.SEARCH_INPUT}
            placeholder="Search issues..."
            value={filters.searchQuery}
            onChange={(e) => filters.setSearchQuery(e.target.value)}
            variant="search"
            aria-label="Search issues"
          />
        </FlexItem>
        <PageControlsGroup className="sm:justify-end">
          <Select
            value={filters.statusFilter || "all"}
            onChange={(nextValue) =>
              filters.setStatusFilter(nextValue === "all" ? undefined : nextValue)
            }
            ariaLabel="Issue status filter"
            options={[
              { value: "all", label: "All Statuses" },
              ...statusOptions.map((option) => ({ value: option.id, label: option.name })),
            ]}
            testId={TEST_IDS.ISSUE.STATUS_FILTER}
            width="sm"
          />

          <Select
            value={filters.priorityFilter || "all"}
            onChange={(nextValue) =>
              filters.setPriorityFilter(nextValue === "all" ? undefined : nextValue)
            }
            ariaLabel="Issue priority filter"
            options={PRIORITY_OPTIONS}
            placeholder="All Priorities"
            testId={TEST_IDS.ISSUE.PRIORITY_FILTER}
            width="sm"
          />

          <Select
            value={filters.typeFilter || "all"}
            onChange={(nextValue) =>
              filters.setTypeFilter(nextValue === "all" ? undefined : nextValue)
            }
            ariaLabel="Issue type filter"
            options={TYPE_OPTIONS}
            placeholder="All Types"
            testId={TEST_IDS.ISSUE.TYPE_FILTER}
            width="sm"
          />

          {filters.hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={filters.clearAll}
              leftIcon={<Icon icon={X} size="sm" />}
            >
              Clear
            </Button>
          )}
        </PageControlsGroup>
      </PageControlsRow>
    </PageControls>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AllIssuesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<Id<"issues"> | null>(null);
  const filters = useIssueFilters();

  const { organizationId } = useOrganization();
  const { filteredIssues, isLoading, loadMore, status, statusOptions } = useIssueResults(
    organizationId,
    filters,
  );

  return (
    <PageLayout>
      <PageStack>
        <PageHeader
          title="Issues"
          description="All issues across your organization"
          spacing="stack"
          actions={
            <Flex align="center" gap="sm">
              <ViewModeToggle />
              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={<Icon icon={Plus} size="sm" />}
              >
                Create Issue
              </Button>
            </Flex>
          }
        />

        <IssueFilterBar filters={filters} statusOptions={statusOptions} />

        {filters.hasActiveFilters && (
          <Typography
            variant="caption"
            color="tertiary"
            data-testid={TEST_IDS.ISSUE.FILTER_SUMMARY}
          >
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? "s" : ""} matching filters
          </Typography>
        )}

        <PageContent
          isLoading={isLoading}
          emptyState={
            filteredIssues.length === 0
              ? {
                  icon: SearchX,
                  title: "No issues found",
                  description: filters.hasActiveFilters
                    ? "Try adjusting your filters or clearing them."
                    : "Create your first issue to get started.",
                }
              : null
          }
        >
          <Grid cols={1} colsMd={2} colsLg={3} colsXl={4} gap="lg">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue._id}
                issue={issue as Parameters<typeof IssueCard>[0]["issue"]}
                status={issue.status}
                onClick={() => setSelectedIssueId(issue._id)}
                canEdit={false}
              />
            ))}
          </Grid>
        </PageContent>

        {!filters.isSearching && status === "CanLoadMore" && (
          <Flex justify="center">
            <Button variant="secondary" onClick={() => loadMore(20)}>
              Load More
            </Button>
          </Flex>
        )}
      </PageStack>

      <CreateIssueModal open={showCreateModal} onOpenChange={setShowCreateModal} />

      {selectedIssueId !== null && (
        <IssueDetailViewer
          issueId={selectedIssueId}
          open={selectedIssueId !== null}
          onOpenChange={() => setSelectedIssueId(null)}
        />
      )}
    </PageLayout>
  );
}
