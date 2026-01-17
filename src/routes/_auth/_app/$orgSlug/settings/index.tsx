import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app/$orgSlug/settings/")({
  beforeLoad: ({ params }) => {
    // Redirect /settings to /settings/profile
    throw redirect({
      to: ROUTES.settings.profile.path,
      params: { orgSlug: params.orgSlug },
    });
  },
  component: () => null,
});
