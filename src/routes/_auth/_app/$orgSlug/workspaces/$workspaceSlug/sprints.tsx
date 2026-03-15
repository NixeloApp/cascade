import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { PageContent, PageError } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { Calendar } from "@/lib/icons";
export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/sprints")({
  component: WorkspaceSprintsPage,
});

function WorkspaceSprintsPage() {
  const { organizationId } = useOrganization();
  const { workspaceSlug } = Route.useParams();

  const workspace = useAuthenticatedQuery(api.workspaces.getBySlug, {
    organizationId,
    slug: workspaceSlug,
  });

  const activeSprints = useAuthenticatedQuery(
    api.workspaces.getActiveSprints,
    workspace ? { workspaceId: workspace._id } : "skip",
  );

  if (workspace === undefined || activeSprints === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  if (!workspace) {
    return (
      <PageError
        title="Workspace Not Found"
        message={`The workspace "${workspaceSlug}" doesn't exist or you don't have access to it.`}
      />
    );
  }

  return (
    <PageContent
      isEmpty={activeSprints.length === 0}
      emptyState={{
        icon: Calendar,
        title: "No active sprints",
        description: "No active sprints were found across projects in this workspace.",
      }}
    >
      <Flex direction="column" gap="md">
        {activeSprints.map((sprint) => (
          <Card key={sprint._id} padding="md">
            <Flex justify="between" align="start" gap="md">
              <Flex direction="column" gap="xs">
                <Typography variant="small" color="tertiary">
                  {sprint.projectKey} · {sprint.projectName}
                </Typography>
                <Typography variant="h4">{sprint.name}</Typography>
                <Typography variant="small" color="secondary">
                  {sprint.issueCount} issues
                </Typography>
              </Flex>
              <Typography variant="small" color="secondary">
                {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : "No end date"}
              </Typography>
            </Flex>
          </Card>
        ))}
      </Flex>
    </PageContent>
  );
}
