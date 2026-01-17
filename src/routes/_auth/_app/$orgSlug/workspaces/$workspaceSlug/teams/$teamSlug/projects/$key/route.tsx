import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key",
)({
  component: ProjectLayout,
});

function ProjectLayout() {
  const { key, orgSlug, workspaceSlug, teamSlug } = Route.useParams();
  const project = useQuery(api.projects.getByKey, { key });

  if (project === undefined) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <LoadingSpinner message="Loading project..." />
      </Flex>
    );
  }

  if (!project) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-semibold mb-2">
            Project Not Found
          </Typography>
          <Typography className="text-ui-text-secondary">
            The project "{key}" doesn't exist or you don't have access to it.
          </Typography>
        </div>
      </Flex>
    );
  }

  const tabs = [
    {
      name: "Board",
      to: ROUTES.workspaces.teams.projects.board.path,
      params: { orgSlug, workspaceSlug, teamSlug, key },
    },
    {
      name: "Calendar",
      to: ROUTES.workspaces.teams.projects.calendar.path,
      params: { orgSlug, workspaceSlug, teamSlug, key },
    },
    {
      name: "Timesheet",
      to: ROUTES.workspaces.teams.projects.timesheet.path,
      params: { orgSlug, workspaceSlug, teamSlug, key },
    },
    {
      name: "Settings",
      to: ROUTES.workspaces.teams.projects.settings.path,
      params: { orgSlug, workspaceSlug, teamSlug, key },
    },
  ];

  return (
    <Flex direction="column" className="h-full">
      {/* Breadcrumb */}
      <div className="px-4 py-2 border-b border-ui-border-primary bg-ui-bg-secondary text-sm">
        <Link
          to={ROUTES.workspaces.list.path}
          params={{ orgSlug }}
          className="text-blue-600 hover:underline"
        >
          Workspaces
        </Link>
        <span className="mx-2 text-ui-text-tertiary">/</span>
        <Link
          to={ROUTES.workspaces.detail.path}
          params={{ orgSlug, workspaceSlug }}
          className="text-blue-600 hover:underline"
        >
          {workspaceSlug}
        </Link>
        <span className="mx-2 text-ui-text-tertiary">/</span>
        <Link
          to={ROUTES.workspaces.teams.detail.path}
          params={{ orgSlug, workspaceSlug, teamSlug }}
          className="text-blue-600 hover:underline"
        >
          {teamSlug}
        </Link>
        <span className="mx-2 text-ui-text-tertiary">/</span>
        <span className="font-medium">{project.name}</span>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-ui-border-primary bg-ui-bg-primary">
        <nav className="flex space-x-4 px-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              to={tab.to}
              params={tab.params}
              className="border-b-2 py-3 px-1 text-sm font-medium transition-colors"
              activeProps={{
                className: "border-brand-indigo-border text-brand-indigo-text",
              }}
              inactiveProps={{
                className:
                  "border-transparent text-ui-text-secondary hover:text-ui-text-primary hover:border-ui-border-secondary",
              }}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </Flex>
  );
}
