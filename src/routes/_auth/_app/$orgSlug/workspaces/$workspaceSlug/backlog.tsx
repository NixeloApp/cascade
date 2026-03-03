import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PageContent, PageError } from "@/components/layout";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { useOrganization } from "@/hooks/useOrgContext";
import { SearchX } from "@/lib/icons";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/backlog")({
  component: WorkspaceBacklogPage,
});

function WorkspaceBacklogPage() {
  const { organizationId } = useOrganization();
  const { workspaceSlug } = Route.useParams();

  const workspace = useQuery(api.workspaces.getBySlug, {
    organizationId,
    slug: workspaceSlug,
  });

  const backlogIssues = useQuery(
    api.workspaces.getBacklogIssues,
    workspace ? { workspaceId: workspace._id } : "skip",
  );

  if (workspace === undefined || backlogIssues === undefined) {
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
      isEmpty={backlogIssues.length === 0}
      emptyState={{
        icon: SearchX,
        title: "Backlog is empty",
        description: "No unsprinted workspace issues are currently in backlog.",
      }}
    >
      <Flex direction="column" gap="md">
        {backlogIssues.map((issue) => (
          <div key={issue._id} className="rounded-lg border border-ui-border bg-ui-bg p-4">
            <Flex justify="between" align="start" gap="md">
              <Flex direction="column" gap="xs">
                <Typography variant="small" color="tertiary">
                  {issue.key}
                </Typography>
                <Typography variant="h4">{issue.title}</Typography>
              </Flex>
              <Flex gap="sm" align="center">
                <Typography variant="small" color="secondary">
                  {issue.status}
                </Typography>
                <Typography variant="small" color="secondary">
                  {issue.priority}
                </Typography>
              </Flex>
            </Flex>
          </div>
        ))}
      </Flex>
    </PageContent>
  );
}
