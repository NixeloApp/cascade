import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$orgSlug/")({
  beforeLoad: ({ params }) => {
    // Redirect /:orgSlug to /:orgSlug/dashboard
    throw redirect({
      to: ROUTES.dashboard.path,
      params: { orgSlug: params.orgSlug },
    });
  },
  component: () => null,
});
