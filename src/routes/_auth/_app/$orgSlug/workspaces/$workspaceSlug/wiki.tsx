import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { WikiDocumentGrid } from "@/components/Documents/WikiDocumentGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { FileText } from "@/lib/icons";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/wiki")({
  component: WorkspaceWikiPage,
});

function WorkspaceWikiPage() {
  const { organizationId, orgSlug } = useOrganization();
  const { workspaceSlug } = Route.useParams();

  const workspace = useAuthenticatedQuery(api.workspaces.getBySlug, {
    organizationId,
    slug: workspaceSlug,
  });

  const documentsResult = useAuthenticatedQuery(
    api.documents.listByWorkspace,
    workspace ? { workspaceId: workspace._id, limit: 50 } : "skip",
  );

  const isLoading = workspace === undefined || documentsResult === undefined;
  const documents = documentsResult?.documents ?? [];

  if (workspace === null) {
    return <Typography variant="h3">Workspace not found</Typography>;
  }

  if (isLoading) {
    return (
      <Flex align="center" justify="center" className="py-20">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No workspace docs yet"
        description="Create documents scoped to this workspace to build a shared wiki."
      />
    );
  }

  return <WikiDocumentGrid documents={documents} orgSlug={orgSlug} />;
}
