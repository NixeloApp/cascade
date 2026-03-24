import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DocumentTree } from "@/components/Documents/DocumentTree";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardSection } from "@/components/ui/CardSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid, GridItem } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { Input } from "@/components/ui/Input";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { FileText, Globe, Lock, Plus, Search, Sparkles } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_auth/_app/$orgSlug/documents/")({
  component: DocumentsListPage,
});

export interface DocumentsWorkspaceDocument {
  _id: Id<"documents">;
  title: string;
  isPublic: boolean;
  creatorName: string;
  updatedAt: number;
}

export interface DocumentsWorkspaceOverview {
  totalCount: number;
  sharedCount: number;
  privateCount: number;
  creatorCount: number;
  latestDocument?: DocumentsWorkspaceDocument;
}

export function filterDocumentsForWorkspace(
  documents: DocumentsWorkspaceDocument[],
  query: string,
): DocumentsWorkspaceDocument[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return documents;
  }

  return documents.filter((document) => {
    const title = document.title.trim().toLowerCase();
    const creator = document.creatorName.trim().toLowerCase();
    return title.includes(normalizedQuery) || creator.includes(normalizedQuery);
  });
}

export function getDocumentsWorkspaceOverview(
  documents: DocumentsWorkspaceDocument[],
): DocumentsWorkspaceOverview {
  const sharedCount = documents.filter((document) => document.isPublic).length;
  const creatorCount = new Set(documents.map((document) => document.creatorName)).size;

  return {
    totalCount: documents.length,
    sharedCount,
    privateCount: documents.length - sharedCount,
    creatorCount,
    latestDocument: [...documents].sort((left, right) => right.updatedAt - left.updatedAt)[0],
  };
}

export function DocumentsListPage() {
  const navigate = useNavigate();
  const { organizationId, orgSlug } = useOrganization();
  const [searchQuery, setSearchQuery] = useState("");

  const documentsResult = useAuthenticatedQuery(api.documents.list, {
    organizationId,
    limit: 50,
  });
  const { mutate: createDocument } = useAuthenticatedMutation(api.documents.create);

  const isLoading = documentsResult === undefined;
  const documents = (documentsResult?.documents ?? []) as DocumentsWorkspaceDocument[];
  const isEmpty = !isLoading && documents.length === 0;
  const filteredDocuments = filterDocumentsForWorkspace(documents, searchQuery);
  const overview = getDocumentsWorkspaceOverview(documents);

  const handleCreateDocument = async (parentId?: Id<"documents">) => {
    try {
      const { documentId } = await createDocument({
        title: "Untitled Document",
        isPublic: false,
        organizationId,
        parentId,
      });

      navigate({
        to: ROUTES.documents.detail.path,
        params: { orgSlug, id: documentId },
      });
      showSuccess(parentId ? "Subpage created" : "Document created");
    } catch (error) {
      showError(error, "Failed to create document");
    }
  };

  return (
    <PageLayout maxWidth="xl">
      <PageHeader
        title="Documents"
        description="Search recent specs, browse the library tree, and keep handoffs in one workspace."
        actions={
          <Flex align="center" gap="sm" wrap>
            <Button
              onClick={() => void handleCreateDocument()}
              leftIcon={<Icon icon={Plus} size="sm" />}
            >
              New Document
            </Button>
            <Button asChild variant="secondary">
              <Link to={ROUTES.documents.templates.path} params={{ orgSlug }}>
                Browse Templates
              </Link>
            </Button>
          </Flex>
        }
      />

      <PageContent
        isLoading={isLoading}
        isEmpty={isEmpty}
        emptyState={{
          icon: FileText,
          title: "No documents yet",
          description:
            "Start with a template or create a blank document to capture specs, notes, and handoffs.",
          action: (
            <Flex align="center" gap="sm" wrap>
              <Button onClick={() => void handleCreateDocument()}>Create Blank Document</Button>
              <Button asChild variant="secondary">
                <Link to={ROUTES.documents.templates.path} params={{ orgSlug }}>
                  Browse Templates
                </Link>
              </Button>
            </Flex>
          ),
        }}
        className={isEmpty ? undefined : "mt-6"}
      >
        <Stack gap="xl">
          <Card padding="lg">
            <Grid cols={1} colsLg={12} gap="lg">
              <GridItem colSpanLg={8}>
                <Stack gap="md">
                  <Flex align="start" gap="md">
                    <IconCircle size="md" tone="brand" variant="muted">
                      <Icon icon={FileText} size="md" />
                    </IconCircle>
                    <Stack gap="xs" className="min-w-0">
                      <Badge variant="info" shape="pill" className="w-fit">
                        Document workspace
                      </Badge>
                      <Typography variant="h3">
                        Keep specs, notes, and handoffs in one reviewable library.
                      </Typography>
                      <Typography variant="muted" color="secondary">
                        Open the latest document immediately, then drop into the sidebar tree when
                        you need folders, favorites, or archived pages.
                      </Typography>
                    </Stack>
                  </Flex>

                  <Grid cols={1} colsSm={3} gap="md">
                    <CardSection>
                      <Typography variant="meta" color="secondary">
                        Total documents
                      </Typography>
                      <Typography variant="h3">{overview.totalCount}</Typography>
                    </CardSection>
                    <CardSection>
                      <Typography variant="meta" color="secondary">
                        Private vs shared
                      </Typography>
                      <Typography variant="h4">{overview.privateCount} private</Typography>
                      <Typography variant="small" color="secondary">
                        {overview.sharedCount} shared
                      </Typography>
                    </CardSection>
                    <CardSection>
                      <Typography variant="meta" color="secondary">
                        Active contributors
                      </Typography>
                      <Typography variant="h3">{overview.creatorCount}</Typography>
                    </CardSection>
                  </Grid>
                </Stack>
              </GridItem>

              <GridItem colSpanLg={4}>
                <CardSection size="lg" className="h-full">
                  <Stack gap="md" className="h-full">
                    <Flex align="center" gap="sm">
                      <IconCircle size="sm" tone="brand" variant="muted">
                        <Icon icon={Sparkles} size="sm" />
                      </IconCircle>
                      <Typography variant="h4">Templates and latest activity</Typography>
                    </Flex>
                    <Typography variant="small" color="secondary">
                      Use templates for repeatable docs, then jump back into the most recent edit
                      without hunting through the full tree.
                    </Typography>
                    {overview.latestDocument ? (
                      <CardSection size="compact">
                        <Stack gap="xs">
                          <Typography variant="small" color="secondary">
                            Latest updated document
                          </Typography>
                          <Typography variant="label">
                            {overview.latestDocument.title || "Untitled Document"}
                          </Typography>
                          <Metadata size="sm">
                            <MetadataItem>{overview.latestDocument.creatorName}</MetadataItem>
                            <MetadataTimestamp date={overview.latestDocument.updatedAt} />
                          </Metadata>
                        </Stack>
                      </CardSection>
                    ) : null}
                    <Button asChild variant="secondary" className="mt-auto">
                      <Link to={ROUTES.documents.templates.path} params={{ orgSlug }}>
                        Browse Templates
                      </Link>
                    </Button>
                  </Stack>
                </CardSection>
              </GridItem>
            </Grid>
          </Card>

          <Grid cols={1} colsLg={12} gap="xl">
            <GridItem colSpanLg={7}>
              <Card recipe="dashboardPanel" padding="lg">
                <Stack gap="md">
                  <Flex align="center" justify="between" gap="md" wrap>
                    <div>
                      <Typography variant="h4">Recent documents</Typography>
                      <Typography variant="small" color="secondary">
                        Search by title or owner, then jump straight into the document you need.
                      </Typography>
                    </div>
                    <Typography variant="small" color="secondary">
                      {filteredDocuments.length} result{filteredDocuments.length === 1 ? "" : "s"}
                    </Typography>
                  </Flex>

                  <Input
                    variant="search"
                    inputSize="md"
                    placeholder="Search documents by title or owner"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Search documents"
                  />

                  {filteredDocuments.length === 0 ? (
                    <CardSection>
                      <EmptyState
                        icon={Search}
                        title="No documents match this search"
                        description="Try a title or owner name, or clear the search to see the full library."
                      />
                    </CardSection>
                  ) : (
                    <Stack gap="sm">
                      {filteredDocuments.map((document) => (
                        <DocumentWorkspaceRow
                          key={document._id}
                          document={document}
                          orgSlug={orgSlug}
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Card>
            </GridItem>

            <GridItem colSpanLg={5}>
              <Card recipe="dashboardPanel" padding="lg">
                <Stack gap="md">
                  <div>
                    <Typography variant="h4">Library index</Typography>
                    <Typography variant="small" color="secondary">
                      Browse folders, favorites, and archived pages from one place instead of
                      relying on the app sidebar alone.
                    </Typography>
                  </div>
                  <DocumentTree organizationId={organizationId} orgSlug={orgSlug} />
                </Stack>
              </Card>
            </GridItem>
          </Grid>
        </Stack>
      </PageContent>
    </PageLayout>
  );
}

function DocumentWorkspaceRow({
  document,
  orgSlug,
}: {
  document: DocumentsWorkspaceDocument;
  orgSlug: string;
}) {
  return (
    <Link
      to={ROUTES.documents.detail.path}
      params={{ orgSlug, id: document._id }}
      className="group block"
    >
      <Card hoverable padding="md">
        <Flex align="start" justify="between" gap="md">
          <Flex align="start" gap="md" className="min-w-0 flex-1">
            <IconCircle size="sm" tone={document.isPublic ? "info" : "secondary"} variant="muted">
              <Icon icon={FileText} size="sm" />
            </IconCircle>
            <Stack gap="xs" className="min-w-0 flex-1">
              <Typography
                variant="label"
                className="truncate transition-colors group-hover:text-brand"
              >
                {document.title || "Untitled Document"}
              </Typography>
              <Metadata size="sm">
                <MetadataItem icon={<Icon icon={document.isPublic ? Globe : Lock} size="xsPlus" />}>
                  {document.isPublic ? "Shared" : "Private"}
                </MetadataItem>
                <MetadataItem>{document.creatorName}</MetadataItem>
                <MetadataTimestamp date={document.updatedAt} />
              </Metadata>
            </Stack>
          </Flex>

          <Badge variant="outline" shape="pill" className="shrink-0">
            Open doc
          </Badge>
        </Flex>
      </Card>
    </Link>
  );
}
