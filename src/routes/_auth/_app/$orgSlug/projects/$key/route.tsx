import { api } from "@convex/_generated/api";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { PageContent, PageControls, PageError, PageHeader, PageStack } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { RouteNav, RouteNavItem } from "@/components/ui/RouteNav";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProjectByKey } from "@/hooks/useProjectByKey";
import { ChevronDown } from "@/lib/icons";
export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key")({
  component: ProjectLayout,
});

interface ProjectTab {
  name: string;
  mobileName: string;
  segment: string;
  to: string;
  params: {
    key: string;
    orgSlug: string;
  };
}

const PROJECT_MOBILE_PRIMARY_SEGMENTS = new Set(["board", "backlog", "calendar"]);

function buildProjectTabs({
  isAdmin,
  isScrum,
  key,
  orgSlug,
}: {
  isAdmin: boolean;
  isScrum: boolean;
  key: string;
  orgSlug: string;
}): ProjectTab[] {
  return [
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
}

function ProjectSectionNav({
  currentSegment,
  tabs,
}: {
  currentSegment: string;
  tabs: ProjectTab[];
}) {
  const mobilePrimaryTabs = tabs.filter((tab) => PROJECT_MOBILE_PRIMARY_SEGMENTS.has(tab.segment));
  const mobileSecondaryTabs = tabs.filter(
    (tab) => !PROJECT_MOBILE_PRIMARY_SEGMENTS.has(tab.segment),
  );
  const activeSecondaryTab = mobileSecondaryTabs.find((tab) => tab.segment === currentSegment);

  return (
    <PageControls tone="strip" padding="sm" gap="sm" spacing="stack">
      <RouteNav variant="pill" size="sm" className="sm:hidden" aria-label="Project sections">
        {mobilePrimaryTabs.map((tab) => (
          <RouteNavItem key={tab.name} asChild variant="pill" size="sm">
            <Link to={tab.to} params={tab.params} activeProps={{ "aria-current": "page" }}>
              {tab.mobileName}
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
                  className="gap-1"
                  aria-label="More project sections"
                >
                  <span>More</span>
                  <Icon icon={ChevronDown} size="xs" tone="tertiary" />
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

      <RouteNav size="sm" className="hidden sm:flex" aria-label="Project sections">
        {tabs.map((tab) => (
          <RouteNavItem key={tab.name} asChild>
            <Link to={tab.to} params={tab.params} activeProps={{ "aria-current": "page" }}>
              {tab.name}
            </Link>
          </RouteNavItem>
        ))}
      </RouteNav>
    </PageControls>
  );
}

/** Project detail shell with a project-owned header and shared section-controls rhythm. */
export function ProjectLayout() {
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
  const tabs = buildProjectTabs({ isAdmin, isScrum, key, orgSlug });
  const currentSegment = location.pathname.split("/").pop() ?? "board";

  return (
    <Flex direction="column" className="h-full min-h-0">
      <div className="px-1 pt-1 sm:px-4 sm:pt-4">
        <PageStack>
          <PageHeader
            title={project.name}
            eyebrow={isScrum ? "Scrum project" : "Kanban project"}
            spacing="stack"
            actions={
              <>
                <Badge variant="projectHeaderKey" shape="pill">
                  {project.key}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {project.boardType}
                </Badge>
              </>
            }
          />

          <ProjectSectionNav currentSegment={currentSegment} tabs={tabs} />
        </PageStack>
      </div>

      <FlexItem flex="1" className="min-h-0 overflow-hidden">
        <Outlet />
      </FlexItem>
    </Flex>
  );
}
