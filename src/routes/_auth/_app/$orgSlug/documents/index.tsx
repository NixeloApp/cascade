import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Globe, Lock } from "lucide-react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
export const Route = createFileRoute("/_auth/_app/$orgSlug/documents/")({
  component: DocumentsListPage,
});

function DocumentsListPage() {
  const { organizationId, orgSlug } = useOrganization();

  const documentsResult = useAuthenticatedQuery(api.documents.list, {
    organizationId,
    limit: 50,
  });

  const isLoading = documentsResult === undefined;
  const documents = documentsResult?.documents ?? [];
  const isEmpty = !isLoading && documents.length === 0;

  return (
    <PageLayout maxWidth="md">
      <PageHeader
        title="Documents"
        description="Create and manage documents for your organization"
        actions={
          <Button asChild variant="secondary">
            <Link to={ROUTES.documents.templates.path} params={{ orgSlug }}>
              Browse Templates
            </Link>
          </Button>
        }
      />

      <PageContent
        isLoading={isLoading}
        isEmpty={isEmpty}
        emptyState={{
          icon: FileText,
          title: "No documents yet",
          description: "Start with a template and capture specs, notes, and handoffs in one place.",
          action: (
            <Button asChild variant="primary">
              <Link to={ROUTES.documents.templates.path} params={{ orgSlug }}>
                Browse Templates
              </Link>
            </Button>
          ),
        }}
        className={isEmpty ? undefined : "mt-6"}
      >
        <Grid cols={1} colsLg={2} gap="lg">
          {documents.map((doc) => (
            <Link
              key={doc._id}
              to={ROUTES.documents.detail.path}
              params={{ orgSlug, id: doc._id }}
              className="group block"
            >
              <Card hoverable padding="lg" className="h-full">
                <Flex direction="column" gap="lg">
                  <Flex justify="between" align="start" gap="md">
                    <Flex align="center" gap="md">
                      <Flex
                        align="center"
                        justify="center"
                        className="h-11 w-11 shrink-0 rounded-xl bg-ui-bg-tertiary text-ui-text-secondary ring-1 ring-ui-border transition-colors group-hover:text-brand"
                      >
                        <FileText size={20} />
                      </Flex>
                      <div>
                        <Typography
                          variant="h4"
                          className="line-clamp-1 tracking-tight transition-colors group-hover:text-brand"
                        >
                          {doc.title || "Untitled"}
                        </Typography>
                        <Flex align="center" gap="sm" className="mt-2 flex-wrap">
                          <Badge variant={doc.isPublic ? "info" : "secondary"} shape="pill">
                            {doc.isPublic ? "Shared document" : "Private document"}
                          </Badge>
                          <Badge variant="outline" shape="pill">
                            {doc.creatorName}
                          </Badge>
                        </Flex>
                      </div>
                    </Flex>
                    <Flex
                      align="center"
                      justify="center"
                      className="shrink-0 text-ui-text-tertiary"
                      title={doc.isPublic ? "Public document" : "Private document"}
                    >
                      {doc.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                    </Flex>
                  </Flex>

                  <Flex
                    align="center"
                    justify="between"
                    gap="md"
                    className="rounded-xl border border-ui-border-secondary/70 bg-ui-bg-soft/90 px-3 py-2"
                  >
                    <Metadata size="sm">
                      <MetadataItem>
                        {doc.isPublic ? "Collaborator visible" : "Internal only"}
                      </MetadataItem>
                      <MetadataTimestamp date={doc.updatedAt} />
                    </Metadata>
                    <Badge variant="outline" shape="pill" className="shrink-0">
                      Open doc
                    </Badge>
                  </Flex>
                </Flex>
              </Card>
            </Link>
          ))}
        </Grid>
      </PageContent>
    </PageLayout>
  );
}
