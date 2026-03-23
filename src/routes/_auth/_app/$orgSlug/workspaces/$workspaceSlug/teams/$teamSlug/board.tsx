import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/KanbanBoard";
import { useTeamLayout } from "./route";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/board",
)({
  component: TeamBoardPage,
});

function TeamBoardPage() {
  const { teamId } = useTeamLayout();
  return <KanbanBoard teamId={teamId} />;
}
