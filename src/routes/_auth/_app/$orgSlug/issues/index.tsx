import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ISSUE_PRIORITIES, ISSUE_TYPES } from "@convex/validators";
import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useMemo, useState } from "react";
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

export function AllIssuesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<Id<"issues"> | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const { organizationId } = useOrganization();

  const statusOptions = useAuthenticatedQuery(
    api.projects.getOrganizationWorkflowStates,
    organizationId ? { organizationId } : "skip",
  );

  const {
    results: issues,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.issues.listOrganizationIssues,
    organizationId
      ? {
          organizationId,
          status: statusFilter,
          priority: priorityFilter,
          type: typeFilter,
        }
      : "skip",
    { initialNumItems: 20 },
  );

  const isLoading = status === "LoadingFirstPage";
  const hasActiveFilters = !!(statusFilter || priorityFilter || typeFilter || searchQuery.trim());

  // Client-side search filtering (on already server-filtered results)
  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues;
    const query = searchQuery.toLowerCase();
    return issues.filter(
      (issue) =>
        issue.title.toLowerCase().includes(query) || issue.key.toLowerCase().includes(query),
    );
  }, [issues, searchQuery]);

  const handleClearFilters = () => {
    setStatusFilter(undefined);
    setPriorityFilter(undefined);
    setTypeFilter(undefined);
    setSearchQuery("");
  };

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

        <PageControls spacing="stack">
          <PageControlsRow>
            <FlexItem flex="1">
              <Input
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="search"
                aria-label="Search issues"
              />
            </FlexItem>
            <PageControlsGroup className="sm:justify-end">
              <Select
                value={statusFilter || "all"}
                onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {(statusOptions ?? []).map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={priorityFilter || "all"}
                onValueChange={(v) => setPriorityFilter(v === "all" ? undefined : v)}
              >
                <SelectTrigger className="w-36">
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
                value={typeFilter || "all"}
                onValueChange={(v) => setTypeFilter(v === "all" ? undefined : v)}
              >
                <SelectTrigger className="w-36">
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

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  leftIcon={<Icon icon={X} size="sm" />}
                >
                  Clear
                </Button>
              )}
            </PageControlsGroup>
          </PageControlsRow>
        </PageControls>

        {hasActiveFilters && (
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
            description: hasActiveFilters
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

        {status === "CanLoadMore" && (
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
