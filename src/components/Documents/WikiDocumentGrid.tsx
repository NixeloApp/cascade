/**
 * Wiki Document Grid
 *
 * Shared grid of document cards used by both workspace and team wiki pages.
 * Displays document title, visibility badge, creator, and last-updated timestamp.
 */

import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { FileText, Globe, Lock } from "@/lib/icons";

export interface WikiDocument {
  _id: string;
  title: string;
  isPublic: boolean;
  creatorName: string;
  updatedAt: number;
}

interface WikiDocumentCardProps {
  doc: WikiDocument;
  orgSlug: string;
}

function WikiDocumentCard({ doc, orgSlug }: WikiDocumentCardProps) {
  return (
    <Link to={ROUTES.documents.detail.path} params={{ orgSlug, id: doc._id }}>
      <Card variant="subtle" hoverable padding="lg">
        <Flex direction="column" gap="md">
          <Flex justify="between" align="start" gap="md">
            <Flex align="center" gap="md">
              <IconCircle size="md" tone="secondary" variant="muted" className="size-10">
                <Icon icon={FileText} size="md" />
              </IconCircle>
              <Typography variant="h3" className="line-clamp-1">
                {doc.title || "Untitled"}
              </Typography>
            </Flex>
            <Flex
              align="center"
              justify="center"
              className="text-ui-text-tertiary shrink-0"
              title={doc.isPublic ? "Public document" : "Private document"}
            >
              <Icon icon={doc.isPublic ? Globe : Lock} size="sm" />
            </Flex>
          </Flex>
          <Metadata>
            <MetadataItem>by {doc.creatorName}</MetadataItem>
            <MetadataTimestamp date={doc.updatedAt} />
          </Metadata>
        </Flex>
      </Card>
    </Link>
  );
}

export interface WikiDocumentGridProps {
  documents: WikiDocument[];
  orgSlug: string;
}

export function WikiDocumentGrid({ documents, orgSlug }: WikiDocumentGridProps) {
  return (
    <Grid cols={1} colsMd={2} colsLg={3} gap="xl">
      {documents.map((doc) => (
        <WikiDocumentCard key={doc._id} doc={doc} orgSlug={orgSlug} />
      ))}
    </Grid>
  );
}
