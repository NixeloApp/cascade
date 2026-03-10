import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PageContent, PageError } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key")({
  component: ProjectLayout,
});

function ProjectLayout() {
  const { key, orgSlug } = Route.useParams();
  const { user } = useCurrentUser();
  const project = useAuthenticatedQuery(api.projects.getByKey, { key });
  const userRole = useAuthenticatedQuery(
    api.projects.getProjectUserRole,
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
      <div className="border-b border-ui-border/70 bg-ui-bg/80 px-2 py-1 backdrop-blur-xl sm:px-4 sm:py-3">
        <div className="rounded-xl border border-ui-border/70 bg-ui-bg-elevated/90 px-2.5 py-2 shadow-soft sm:rounded-2xl sm:px-4 sm:py-3">
          <Flex align="start" justify="between" gap="sm" className="flex-col sm:flex-row">
            <Flex align="center" gap="sm" className="min-w-0">
              <Flex
                align="center"
                justify="center"
                className="h-8 w-8 shrink-0 rounded-lg bg-brand-subtle text-brand ring-1 ring-brand/15 sm:h-10 sm:w-10 sm:rounded-xl"
              >
                <Typography variant="small" className="font-semibold text-current">
                  {project.key.slice(0, 2).toUpperCase()}
                </Typography>
              </Flex>
              <div className="min-w-0">
                <Typography
                  variant="caption"
                  color="tertiary"
                  className="hidden uppercase tracking-wider sm:block"
                >
                  {isScrum ? "Scrum project" : "Kanban project"}
                </Typography>
                <Typography variant="h4" className="truncate text-base tracking-tight sm:text-2xl">
                  {project.name}
                </Typography>
              </div>
            </Flex>
            <Badge
              variant="outline"
              shape="pill"
              className="hidden bg-ui-bg-soft uppercase tracking-wider sm:inline-flex"
            >
              {project.key}
            </Badge>
          </Flex>

          <nav
            className="mt-1 flex gap-1 overflow-x-auto pb-1 scrollbar-subtle sm:mt-2"
            aria-label="Project sections"
          >
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                to={tab.to}
                params={tab.params}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-default sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm",
                  "text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text",
                )}
                activeProps={{
                  className: "bg-ui-bg text-ui-text shadow-soft ring-1 ring-ui-border/70",
                }}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <FlexItem flex="1" className="overflow-hidden">
        <Outlet />
      </FlexItem>
    </Flex>
  );
}
