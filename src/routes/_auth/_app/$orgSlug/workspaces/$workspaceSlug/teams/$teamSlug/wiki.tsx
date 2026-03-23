import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { WikiDocumentGrid } from "@/components/Documents/WikiDocumentGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { FileText } from "@/lib/icons";
import { useTeamLayout } from "./route";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/wiki",
)({
  component: TeamWikiPage,
});

function TeamWikiPage() {
  const { orgSlug } = useOrganization();
  const { teamId } = useTeamLayout();

  const documentsResult = useAuthenticatedQuery(api.documents.listByTeam, {
    teamId,
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
        title="No team wiki docs yet"
        description="Create team-scoped docs to build your team wiki."
      />
    );
  }

  return <WikiDocumentGrid documents={documents} orgSlug={orgSlug} />;
}
