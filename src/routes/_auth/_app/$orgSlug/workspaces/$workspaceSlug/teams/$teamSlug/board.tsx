import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Flex } from "@/components/ui/Flex";
import { Skeleton } from "@/components/ui/Skeleton";
import { Typography } from "@/components/ui/Typography";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/board",
)({
  component: TeamBoardPage,
});

function TeamBoardPage() {
  const { organizationId } = useOrganization();
  const { teamSlug } = Route.useParams();

  const team = useQuery(api.teams.getBySlug, {
    organizationId: organizationId,
    slug: teamSlug,
  });

  if (!team) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Flex gap="lg">
          <Skeleton className="h-96 w-72" />
          <Skeleton className="h-96 w-72" />
          <Skeleton className="h-96 w-72" />
        </Flex>
      </div>
    );
  }

  return (
    <Flex direction="column" className="h-full">
      <div className="px-6 py-4 border-b border-ui-border-primary">
        <Typography variant="h1" className="text-2xl font-semibold text-ui-text-primary">
          {team.name} Board
        </Typography>
      </div>
      <KanbanBoard teamId={team._id} />
    </Flex>
  );
}
