import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PageHeader, PageLayout } from "@/components/layout";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { organizationId, orgSlug } = useOrganization();
  const { workspaceSlug } = Route.useParams();

  const workspace = useQuery(api.workspaces.getBySlug, {
    organizationId: organizationId,
    slug: workspaceSlug,
  });

  if (workspace === undefined) {
    return (
      <Flex direction="column" align="center" justify="center" className="min-h-96">
        <LoadingSpinner />
      </Flex>
    );
  }

  if (workspace === null) {
    return (
      <PageLayout>
        <Typography variant="h2">Workspace not found</Typography>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={workspace.name}
        description={workspace.description ?? undefined}
        breadcrumbs={[
          { label: "Workspaces", to: ROUTES.workspaces.list.build(orgSlug) },
          { label: workspace.name },
        ]}
      />

      {/* Tabs */}
      <div className="border-b border-ui-border mb-6">
        <nav className="flex gap-6">
          <Link
            to={ROUTES.workspaces.detail.path}
            params={{ orgSlug, workspaceSlug }}
            className="px-1 py-3 border-b-2 border-brand font-medium text-brand"
          >
            Teams
          </Link>
          <Link
            to={ROUTES.workspaces.settings.path}
            params={{ orgSlug, workspaceSlug }}
            className="px-1 py-3 border-b-2 border-transparent hover:border-ui-border-secondary text-ui-text-secondary hover:text-ui-text"
          >
            Settings
          </Link>
        </nav>
      </div>

      {/* Content */}
      <Outlet />
    </PageLayout>
  );
}
