import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: ROUTES.workspaces.teams.list.path,
      params: { orgSlug: params.orgSlug, workspaceSlug: params.workspaceSlug },
    });
  },
  component: () => null,
});
