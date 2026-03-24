import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { WikiDocumentGrid } from "@/components/Documents/WikiDocumentGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { FileText } from "@/lib/icons";
import { useWorkspaceLayout } from "./route";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/wiki")({
  component: WorkspaceWikiPage,
});

function WorkspaceWikiPage() {
  const { orgSlug } = useOrganization();
  const { workspaceId } = useWorkspaceLayout();

  const documentsResult = useAuthenticatedQuery(api.documents.listByWorkspace, {
    workspaceId,
    limit: 50,
  });

  const documents = documentsResult?.documents ?? [];

  if (documentsResult === undefined) {
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
