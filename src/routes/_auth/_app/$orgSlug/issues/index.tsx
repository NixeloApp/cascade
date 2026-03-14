import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { CreateIssueModal, IssueCard } from "@/components/IssueDetail";
import { IssueDetailViewer } from "@/components/IssueDetailViewer";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useOrganization } from "@/hooks/useOrgContext";
import { Plus, SearchX } from "@/lib/icons";

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
  const filteredIssues = !searchQuery.trim()
    ? issues
    : issues.filter((issue) => {
        const query = searchQuery.toLowerCase();
        return issue.title.toLowerCase().includes(query) || issue.key.toLowerCase().includes(query);
      });

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
        <FlexItem flex="1">
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="search"
          />
        </FlexItem>
        <Flex gap="sm" align="center">
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="inprogress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
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
        <IssueDetailViewer
          issueId={selectedIssueId}
          open={selectedIssueId !== null}
          onOpenChange={handleCloseDetail}
        />
      )}
    </PageLayout>
  );
}
