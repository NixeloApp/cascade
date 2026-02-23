import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PageContent, PageError } from "@/components/layout";
import { Flex, FlexItem } from "@/components/ui/Flex";
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
    api.projectMembers.getRole,
    project ? { projectId: project._id } : "skip",
  );

  // Still loading initial data
  if (project === undefined || user === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  // Project not found - check before userRole since userRole query is skipped when project is null
  if (project === null) {
    return (
      <PageError
        title="Project Not Found"
        message={`The project "${key}" doesn't exist or you don't have access to it.`}
      />
    );
  }

  // Wait for user role (only runs after project is confirmed to exist)
  if (userRole === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  // Check if user is admin (via role OR ownership)
  const isAdmin = userRole === "admin" || project.ownerId === user?._id;

  const isScrum = project.boardType === "scrum";

  const tabs = [
    { name: "Board", to: ROUTES.projects.board.path, params: { orgSlug, key } },
    { name: "Backlog", to: ROUTES.projects.backlog.path, params: { orgSlug, key } },
    { name: "Inbox", to: ROUTES.projects.inbox.path, params: { orgSlug, key } },
    ...(isScrum
      ? [{ name: "Sprints", to: ROUTES.projects.sprints.path, params: { orgSlug, key } }]
      : []),
    { name: "Roadmap", to: ROUTES.projects.roadmap.path, params: { orgSlug, key } },
    { name: "Calendar", to: ROUTES.projects.calendar.path, params: { orgSlug, key } },
    { name: "Activity", to: ROUTES.projects.activity.path, params: { orgSlug, key } },
    { name: "Analytics", to: ROUTES.projects.analytics.path, params: { orgSlug, key } },
    { name: "Billing", to: ROUTES.projects.billing.path, params: { orgSlug, key } },
    { name: "Timesheet", to: ROUTES.projects.timesheet.path, params: { orgSlug, key } },
    ...(isAdmin
      ? [{ name: "Settings", to: ROUTES.projects.settings.path, params: { orgSlug, key } }]
      : []),
  ];

  return (
    <Flex direction="column" className="h-full">
      {/* Tab Navigation */}
      <div className="border-b border-ui-border bg-ui-bg">
        <nav className="flex space-x-4 px-4 overflow-x-auto" aria-label="Tabs">
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
                  "border-transparent text-ui-text-secondary hover:text-ui-text hover:border-ui-border-secondary",
              }}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <FlexItem flex="1" className="overflow-hidden">
        <Outlet />
      </FlexItem>
    </Flex>
  );
}
