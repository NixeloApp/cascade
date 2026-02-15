import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useMemo, useState } from "react";
import { CreateIssueModal } from "@/components/CreateIssueModal";
import { IssueCard } from "@/components/IssueCard";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { useOrganization } from "@/hooks/useOrgContext";
import { Filter, Plus, Search, SearchX } from "@/lib/icons";

export const Route = createFileRoute("/_auth/_app/$orgSlug/issues/")({
  component: AllIssuesPage,
});

function AllIssuesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<Id<"issues"> | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const { organizationId } = useOrganization();

  const {
    results: issues,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.issues.listOrganizationIssues,
    organizationId ? { status: statusFilter, organizationId } : "skip",
    { initialNumItems: 20 },
  );

  const isLoading = status === "LoadingFirstPage";

  // Client-side search filtering
  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues;
    const query = searchQuery.toLowerCase();
    return issues.filter(
      (issue) =>
        issue.title.toLowerCase().includes(query) || issue.key.toLowerCase().includes(query),
    );
  }, [issues, searchQuery]);

  const handleIssueClick = (id: Id<"issues">) => {
    setSelectedIssueId(id);
  };

  const handleCloseDetail = () => {
    setSelectedIssueId(null);
  };

  return (
    <PageLayout>
      <PageHeader
        title="Issues"
        description="All issues across your organization"
        actions={
          <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create Issue
          </Button>
        }
      />

      {/* Filters & Search */}
      <Flex gap="md" className="mb-6 bg-ui-bg p-4 rounded-lg border border-ui-border">
        <FlexItem flex="1" className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-text-tertiary" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-ui-bg-secondary border border-ui-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-ring"
          />
        </FlexItem>
        <Flex gap="sm" align="center">
          <Filter className="w-4 h-4 text-ui-text-tertiary" />
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="bg-ui-bg-secondary border border-ui-border rounded-md px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </Flex>
      </Flex>

      {/* Content */}
      <PageContent
        isLoading={isLoading}
        isEmpty={filteredIssues.length === 0}
        emptyState={{
          icon: SearchX,
          title: "No issues found",
          description: "Try adjusting your filters or create a new issue.",
        }}
      >
        <Grid cols={1} colsMd={2} colsLg={3} colsXl={4} gap="lg">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue._id}
              issue={issue as Parameters<typeof IssueCard>[0]["issue"]}
              status={issue.status}
              onClick={handleIssueClick}
              canEdit={false} // Disable dragging in global view
            />
          ))}
        </Grid>
      </PageContent>

      {/* Load More */}
      {status === "CanLoadMore" && (
        <Flex justify="center" className="mt-8">
          <Button variant="secondary" onClick={() => loadMore(20)}>
            Load More
          </Button>
        </Flex>
      )}

      <CreateIssueModal open={showCreateModal} onOpenChange={setShowCreateModal} />

      {selectedIssueId !== null && (
        <IssueDetailModal
          issueId={selectedIssueId}
          open={selectedIssueId !== null}
          onOpenChange={handleCloseDetail}
        />
      )}
    </PageLayout>
  );
}
