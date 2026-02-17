import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, usePaginatedQuery } from "convex/react";
import { useMemo, useState } from "react";
import { IssueCard } from "@/components/IssueCard";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Typography } from "@/components/ui/Typography";
import { useOrganization } from "@/hooks/useOrgContext";
import { Archive, RotateCcw, Search } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_auth/_app/$orgSlug/archives")({
  component: ArchivesPage,
});

function ArchivesPage() {
  const [selectedIssueId, setSelectedIssueId] = useState<Id<"issues"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [restoringIds, setRestoringIds] = useState<Set<Id<"issues">>>(new Set());

  const { organizationId } = useOrganization();

  const restoreIssue = useMutation(api.issues.restore);

  const {
    results: archivedIssues,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.issues.listArchivedIssues,
    organizationId ? { organizationId } : "skip",
    { initialNumItems: 20 },
  );

  const isLoading = status === "LoadingFirstPage";

  // Client-side search filtering
  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return archivedIssues;
    const query = searchQuery.toLowerCase();
    return archivedIssues.filter(
      (issue) =>
        issue.title.toLowerCase().includes(query) || issue.key.toLowerCase().includes(query),
    );
  }, [archivedIssues, searchQuery]);

  const handleIssueClick = (id: Id<"issues">) => {
    setSelectedIssueId(id);
  };

  const handleCloseDetail = () => {
    setSelectedIssueId(null);
  };

  const handleRestore = async (issueId: Id<"issues">) => {
    setRestoringIds((prev) => new Set([...prev, issueId]));
    try {
      const result = await restoreIssue({ issueId });
      if (result.success) {
        showSuccess("Issue restored successfully");
      } else {
        showError(result.error || "Failed to restore issue");
      }
    } catch (error) {
      showError(error, "Failed to restore issue");
    } finally {
      setRestoringIds((prev) => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
    }
  };

  return (
    <PageLayout>
      <PageHeader title="Archives" description="Completed issues that have been archived" />

      {/* Search */}
      <Flex gap="md" className="mb-6 bg-ui-bg p-4 rounded-lg border border-ui-border">
        <FlexItem flex="1" className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-text-tertiary" />
          <input
            type="text"
            placeholder="Search archived issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-ui-bg-secondary border border-ui-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-ring"
          />
        </FlexItem>
      </Flex>

      {/* Content */}
      <PageContent
        isLoading={isLoading}
        isEmpty={filteredIssues.length === 0}
        emptyState={{
          icon: Archive,
          title: "No archived issues",
          description: "Completed issues that you archive will appear here.",
        }}
      >
        <Grid cols={1} colsMd={2} colsLg={3} colsXl={4} gap="lg">
          {filteredIssues.map((issue) => (
            <div key={issue._id} className="relative group">
              <IssueCard
                issue={issue as Parameters<typeof IssueCard>[0]["issue"]}
                status={issue.status}
                onClick={handleIssueClick}
                canEdit={false}
              />
              {/* Restore button overlay */}
              <Flex
                align="center"
                justify="center"
                className="absolute inset-0 bg-ui-bg/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
              >
                <Flex direction="column" align="center" gap="sm">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(issue._id);
                    }}
                    isLoading={restoringIds.has(issue._id)}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Restore
                  </Button>
                  <Typography variant="small" className="text-ui-text-secondary">
                    Move back to project
                  </Typography>
                </Flex>
              </Flex>
            </div>
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
