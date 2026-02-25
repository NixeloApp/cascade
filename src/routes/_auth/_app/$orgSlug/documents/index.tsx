import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { FileText, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/_app/$orgSlug/documents/")({
  component: DocumentsListPage,
});

function DocumentsListPage() {
  const { organizationId, orgSlug } = useOrganization();

  const documentsResult = useQuery(api.documents.list, {
    organizationId,
    limit: 50,
  });

  const isLoading = documentsResult === undefined;
  const documents = documentsResult?.documents ?? [];
  const isEmpty = !isLoading && documents.length === 0;

  return (
    <Flex direction="column" gap="lg" className="p-6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Flex direction="column" gap="xs">
          <Typography variant="h2" className="tracking-tight">
            Documents
          </Typography>
          <Typography variant="p" color="secondary">
            Create and manage documents for your organization
          </Typography>
        </Flex>
      </Flex>

      {/* Content */}
      {isLoading ? (
        <Flex align="center" justify="center" className="py-20">
          <LoadingSpinner size="lg" />
        </Flex>
      ) : isEmpty ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Create your first document to start collaborating with your team"
          action={<Button variant="primary">+ New Document</Button>}
        />
      ) : (
        <Grid cols={1} colsMd={2} colsLg={3} gap="xl">
          {documents.map((doc) => (
            <Link
              key={doc._id}
              to={ROUTES.documents.detail.path}
              params={{ orgSlug, id: doc._id }}
              className="group"
            >
              <div
                className={cn(
                  "card-subtle p-5 cursor-pointer",
                  "transform transition-all duration-default",
                  "hover:scale-[var(--scale-hover-subtle)]",
                )}
              >
                <Flex direction="column" gap="md">
                  {/* Document header with icon and visibility */}
                  <Flex justify="between" align="start" gap="md">
                    <Flex align="center" gap="md">
                      {/* Document icon */}
                      <Flex
                        align="center"
                        justify="center"
                        className="w-10 h-10 rounded-lg bg-ui-bg-tertiary text-ui-text-secondary shrink-0 group-hover:text-brand transition-colors"
                      >
                        <FileText size={20} />
                      </Flex>
                      <Typography
                        variant="h3"
                        className="tracking-tight group-hover:text-brand transition-colors line-clamp-1"
                      >
                        {doc.title || "Untitled"}
                      </Typography>
                    </Flex>
                    {/* Visibility indicator */}
                    <Flex
                      align="center"
                      justify="center"
                      className="text-ui-text-tertiary shrink-0"
                      title={doc.isPublic ? "Public document" : "Private document"}
                    >
                      {doc.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                    </Flex>
                  </Flex>

                  {/* Metadata */}
                  <Metadata>
                    <MetadataItem>by {doc.creatorName}</MetadataItem>
                    <MetadataTimestamp date={doc.updatedAt} />
                  </Metadata>
                </Flex>
              </div>
            </Link>
          ))}
        </Grid>
      )}
    </Flex>
  );
}
