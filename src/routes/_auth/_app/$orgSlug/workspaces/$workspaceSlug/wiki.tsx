import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { FileText, Globe, Lock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/wiki")({
  component: WorkspaceWikiPage,
});

function WorkspaceWikiPage() {
  const { organizationId, orgSlug } = useOrganization();
  const { workspaceSlug } = Route.useParams();

  const workspace = useQuery(api.workspaces.getBySlug, {
    organizationId,
    slug: workspaceSlug,
  });

  const documentsResult = useQuery(
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

  return (
    <Grid cols={1} colsMd={2} colsLg={3} gap="xl">
      {documents.map((doc) => (
        <Link key={doc._id} to={ROUTES.documents.detail.path} params={{ orgSlug, id: doc._id }}>
          <div
            className={cn(
              "card-subtle p-5 cursor-pointer",
              "transform transition-all duration-default",
              "hover:scale-[var(--scale-hover-subtle)]",
            )}
          >
            <Flex direction="column" gap="md">
              <Flex justify="between" align="start" gap="md">
                <Flex align="center" gap="md">
                  <Flex
                    align="center"
                    justify="center"
                    className="w-10 h-10 rounded-lg bg-ui-bg-tertiary text-ui-text-secondary shrink-0"
                  >
                    <FileText size={20} />
                  </Flex>
                  <Typography variant="h3" className="tracking-tight line-clamp-1">
                    {doc.title || "Untitled"}
                  </Typography>
                </Flex>
                <Flex
                  align="center"
                  justify="center"
                  className="text-ui-text-tertiary shrink-0"
                  title={doc.isPublic ? "Public document" : "Private document"}
                >
                  {doc.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                </Flex>
              </Flex>
              <Metadata>
                <MetadataItem>by {doc.creatorName}</MetadataItem>
                <MetadataTimestamp date={doc.updatedAt} />
              </Metadata>
            </Flex>
          </div>
        </Link>
      ))}
    </Grid>
  );
}
