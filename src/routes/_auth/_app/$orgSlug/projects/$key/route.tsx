import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { PageContent, PageError } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { RouteNav, RouteNavItem } from "@/components/ui/RouteNav";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProjectByKey } from "@/hooks/useProjectByKey";
import { ChevronDown } from "@/lib/icons";
export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key")({
  component: ProjectLayout,
});

function ProjectLayout() {
  const { key, orgSlug } = Route.useParams();
  const location = useLocation();
  const { user } = useCurrentUser();
  const project = useProjectByKey(key);
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
    {
      name: "Board",
      mobileName: "Board",
      segment: "board",
      to: ROUTES.projects.board.path,
      params: { orgSlug, key },
    },
    {
      name: "Backlog",
      mobileName: "Backlog",
      segment: "backlog",
      to: ROUTES.projects.backlog.path,
      params: { orgSlug, key },
    },
    {
      name: "Inbox",
      mobileName: "Inbox",
      segment: "inbox",
      to: ROUTES.projects.inbox.path,
      params: { orgSlug, key },
    },
    ...(isScrum
      ? [
          {
            name: "Sprints",
            mobileName: "Sprints",
            segment: "sprints",
            to: ROUTES.projects.sprints.path,
            params: { orgSlug, key },
          },
        ]
      : []),
    {
      name: "Roadmap",
      mobileName: "Plan",
      segment: "roadmap",
      to: ROUTES.projects.roadmap.path,
      params: { orgSlug, key },
    },
    {
      name: "Calendar",
      mobileName: "Cal",
      segment: "calendar",
      to: ROUTES.projects.calendar.path,
      params: { orgSlug, key },
    },
    {
      name: "Activity",
      mobileName: "Activity",
      segment: "activity",
      to: ROUTES.projects.activity.path,
      params: { orgSlug, key },
    },
    {
      name: "Analytics",
      mobileName: "Stats",
      segment: "analytics",
      to: ROUTES.projects.analytics.path,
      params: { orgSlug, key },
    },
    {
      name: "Billing",
      mobileName: "Billing",
      segment: "billing",
      to: ROUTES.projects.billing.path,
      params: { orgSlug, key },
    },
    {
      name: "Timesheet",
      mobileName: "Time",
      segment: "timesheet",
      to: ROUTES.projects.timesheet.path,
      params: { orgSlug, key },
    },
    ...(isAdmin
      ? [
          {
            name: "Settings",
            mobileName: "Settings",
            segment: "settings",
            to: ROUTES.projects.settings.path,
            params: { orgSlug, key },
          },
        ]
      : []),
  ];
  const currentSegment = location.pathname.split("/").pop() ?? "board";
  const mobilePrimaryTabs = tabs.filter((tab) =>
    ["board", "backlog", "calendar"].includes(tab.segment),
  );
  const mobileSecondaryTabs = tabs.filter(
    (tab) => !["board", "backlog", "calendar"].includes(tab.segment),
  );
  const activeSecondaryTab = mobileSecondaryTabs.find((tab) => tab.segment === currentSegment);

  return (
    <Flex direction="column" className="h-full">
      <div className="border-b border-ui-border/70 bg-ui-bg/84 px-1 py-0.5 backdrop-blur-xl sm:px-4 sm:py-3">
        <div className="bg-transparent px-0 py-0 shadow-none sm:rounded-3xl sm:border sm:border-ui-border-secondary/75 sm:bg-linear-to-r sm:from-ui-bg-elevated sm:via-ui-bg-elevated/98 sm:to-ui-bg-soft/76 sm:px-4 sm:py-3 sm:shadow-card">
          <Flex
            align="start"
            justify="between"
            gap="xs"
            className="flex-col sm:flex-row sm:items-center"
          >
            <Flex align="center" gap="xs" className="min-w-0 sm:gap-sm">
              <Flex
                align="center"
                justify="center"
                className="h-6 w-6 shrink-0 rounded-full bg-brand-subtle text-brand ring-1 ring-brand/18 sm:h-10 sm:w-10 sm:rounded-xl"
              >
                <Typography variant="small" className="font-semibold text-current">
                  {project.key.slice(0, 2).toUpperCase()}
                </Typography>
              </Flex>
              <div className="min-w-0">
                <Flex align="center" gap="xs" className="min-w-0">
                  <Typography variant="h4" className="truncate text-sm tracking-tight sm:text-2xl">
                    {project.name}
                  </Typography>
                </Flex>
                <Typography
                  variant="caption"
                  color="tertiary"
                  className="mt-0.5 hidden uppercase tracking-wider sm:block"
                >
                  {isScrum ? "Scrum project" : "Kanban project"}
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

          <RouteNav
            variant="pill"
            size="sm"
            className="mt-0.5 flex items-center overflow-x-auto pb-0 pr-0 sm:hidden"
            aria-label="Project sections"
          >
            {mobilePrimaryTabs.map((tab) => (
              <RouteNavItem key={tab.name} asChild variant="pill" size="sm">
                <Link
                  to={tab.to}
                  params={tab.params}
                  activeProps={{ "aria-current": "page", "data-active": "true" }}
                >
                  {tab.mobileName ?? tab.name}
                </Link>
              </RouteNavItem>
            ))}
            {mobileSecondaryTabs.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <RouteNavItem asChild variant="pill" size="sm" active={!!activeSecondaryTab}>
                    <Button
                      variant="unstyled"
                      size={undefined}
                      className="gap-0.5"
                      aria-label="More project sections"
                    >
                      <span>More</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </RouteNavItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  {mobileSecondaryTabs.map((tab) => (
                    <DropdownMenuItem key={tab.name} asChild>
                      <Link to={tab.to} params={tab.params} className="w-full">
                        {tab.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </RouteNav>

          <RouteNav
            variant="pill"
            className="mt-1 hidden gap-1 overflow-x-auto pb-0.5 pr-1 scrollbar-subtle sm:mt-3 sm:flex sm:pb-1"
            aria-label="Project sections"
          >
            {tabs.map((tab) => (
              <RouteNavItem key={tab.name} asChild variant="pill">
                <Link
                  to={tab.to}
                  params={tab.params}
                  activeProps={{ "aria-current": "page", "data-active": "true" }}
                >
                  {tab.name}
                </Link>
              </RouteNavItem>
            ))}
          </RouteNav>
        </div>
      </div>

      {/* Tab Content */}
      <FlexItem flex="1" className="overflow-hidden">
        <Outlet />
      </FlexItem>
    </Flex>
  );
}
