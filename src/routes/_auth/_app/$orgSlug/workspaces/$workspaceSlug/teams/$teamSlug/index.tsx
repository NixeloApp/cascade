import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: ROUTES.workspaces.teams.board.path,
      params: {
        orgSlug: params.orgSlug,
        workspaceSlug: params.workspaceSlug,
        teamSlug: params.teamSlug,
      },
    });
  },
  component: () => null,
});
