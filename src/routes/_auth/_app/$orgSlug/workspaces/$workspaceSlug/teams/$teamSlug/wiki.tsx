import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { IconCircle } from "@/components/ui/IconCircle";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { FileText, Globe, Lock } from "@/lib/icons";
import { cn } from "@/lib/utils";
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
                  <IconCircle size="md" tone="secondary" variant="muted" className="size-10">
                    <FileText size={20} />
                  </IconCircle>
                  <Typography variant="wikiCardTitle">{doc.title || "Untitled"}</Typography>
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
