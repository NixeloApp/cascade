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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { Plus, SearchX, X } from "@/lib/icons";

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
            onValueChange={(v) => filters.setStatusFilter(v === "all" ? undefined : v)}
          >
            <SelectTrigger width="36">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priorityFilter || "all"}
            onValueChange={(v) => filters.setPriorityFilter(v === "all" ? undefined : v)}
          >
            <SelectTrigger width="36">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.typeFilter || "all"}
            onValueChange={(v) => filters.setTypeFilter(v === "all" ? undefined : v)}
          >
            <SelectTrigger width="36">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

  const statusOptions = useAuthenticatedQuery(
    api.projects.getOrganizationWorkflowStates,
    organizationId ? { organizationId } : "skip",
  );

  const {
    results: paginatedIssues,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.issues.listOrganizationIssues,
    organizationId && !filters.isSearching
      ? {
          organizationId,
          status: filters.statusFilter,
          priority: filters.priorityFilter,
          type: filters.typeFilter,
        }
      : "skip",
    { initialNumItems: 20 },
  );

  const searchResults = useAuthenticatedQuery(
    api.issues.searchOrganizationIssues,
    organizationId && filters.isSearching
      ? {
          organizationId,
          query: filters.deferredSearch,
          status: filters.statusFilter,
          priority: filters.priorityFilter,
          type: filters.typeFilter,
        }
      : "skip",
  );

  const isLoading = filters.isSearching
    ? searchResults === undefined
    : status === "LoadingFirstPage";
  const filteredIssues = filters.isSearching ? (searchResults ?? []) : paginatedIssues;

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

        <IssueFilterBar filters={filters} statusOptions={statusOptions ?? []} />

        {filters.hasActiveFilters && (
          <Typography variant="caption" color="tertiary">
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? "s" : ""} matching filters
          </Typography>
        )}

        <PageContent
          isLoading={isLoading}
          isEmpty={filteredIssues.length === 0}
          emptyState={{
            icon: SearchX,
            title: "No issues found",
            description: filters.hasActiveFilters
              ? "Try adjusting your filters or clearing them."
              : "Create your first issue to get started.",
          }}
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
