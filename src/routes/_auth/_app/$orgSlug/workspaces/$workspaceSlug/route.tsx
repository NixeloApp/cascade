import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "convex/react";
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
      <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
        <LoadingSpinner />
      </Flex>
    );
  }

  if (workspace === null) {
    return (
      <div className="container mx-auto p-6">
        <Typography variant="h2">Workspace not found</Typography>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm">
        <Link
          to={ROUTES.workspaces.list.path}
          params={{ orgSlug }}
          className="text-blue-600 hover:underline"
        >
          Workspaces
        </Link>
        <span className="mx-2">/</span>
        <span>{workspace.name}</span>
      </div>

      {/* Workspace Header */}
      <div className="mb-8">
        <Flex align="center" gap="sm" className="mb-2">
          {workspace.icon && <span className="text-4xl">{workspace.icon}</span>}
          <Typography variant="h1">{workspace.name}</Typography>
        </Flex>
        {workspace.description && (
          <Typography variant="p" color="secondary">
            {workspace.description}
          </Typography>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <Link
            to={ROUTES.workspaces.detail.path}
            params={{ orgSlug, workspaceSlug }}
            className="px-1 py-3 border-b-2 border-blue-600 font-medium text-blue-600"
          >
            Teams
          </Link>
          <Link
            to={ROUTES.workspaces.settings.path}
            params={{ orgSlug, workspaceSlug }}
            className="px-1 py-3 border-b-2 border-transparent hover:border-gray-300 text-gray-600"
          >
            Settings
          </Link>
        </nav>
      </div>

      {/* Content */}
      <Outlet />
    </div>
  );
}
