import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key")({
  component: ProjectLayout,
});

function ProjectLayout() {
  const { key, orgSlug } = Route.useParams();
  const { user } = useCurrentUser();
  const project = useQuery(api.projects.getByKey, { key });
  const userRole = useQuery(
    api.projects.getProjectUserRole,
    project ? { projectId: project._id } : "skip",
  );

  if (project === undefined || userRole === undefined || user === undefined) {
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

  // Check if user is admin (via role OR ownership)
  const isAdmin = userRole === "admin" || project.ownerId === user?._id;

  const tabs = [
    {
      name: "Board",
      to: ROUTES.projects.board.path,
      params: { orgSlug, key },
    },
    {
      name: "Calendar",
      to: ROUTES.projects.calendar.path,
      params: { orgSlug, key },
    },
    {
      name: "Timesheet",
      to: ROUTES.projects.timesheet.path,
      params: { orgSlug, key },
    },
    // Only show Settings tab to admins
    ...(isAdmin
      ? [
          {
            name: "Settings",
            to: ROUTES.projects.settings.path,
            params: { orgSlug, key },
          },
        ]
      : []),
  ];

  return (
    <Flex direction="column" className="h-full">
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
