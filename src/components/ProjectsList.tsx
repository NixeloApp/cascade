/**
 * Projects List
 *
 * Grid of project cards with pagination support.
 * Shows project name, key, description, and member count.
 * Links to individual project board views.
 */

import { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import {
  DashboardPanel,
  DashboardPanelBody,
  DashboardPanelHeader,
} from "@/components/Dashboard/DashboardPanel";
import { PageContent } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { Metadata, MetadataItem } from "@/components/ui/Metadata";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthReady } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { Calendar, Folder, KanbanSquare, MapIcon, Plus } from "@/lib/icons";
import { cn } from "@/lib/utils";

type PaginatedQuery = FunctionReference<"query", "public">;

interface ProjectsListProps {
  onCreateClick: () => void;
}

interface ProjectListItem {
  _id: string;
  key: string;
  name: string;
  description?: string;
  issueCount?: number;
  boardType: "kanban" | "scrum";
}

const EMPTY_PROJECT_STATE_TIPS = [
  {
    description:
      "Set up one project per initiative so priorities, docs, and delivery work stay in the same place.",
    title: "Start with structure",
  },
  {
    description:
      "Use projects to group issues by team, product area, or client engagement instead of scattering work across boards.",
    title: "Keep ownership visible",
  },
  {
    description:
      "Once the first project exists, your backlog, roadmap, calendar, and analytics views become much easier to navigate.",
    title: "Build momentum fast",
  },
] as const;

const SINGLE_PROJECT_SURFACES = [
  {
    description: "Move active issues, triage incoming work, and keep delivery flowing.",
    icon: KanbanSquare,
    id: "board",
    label: "Board",
    route: ROUTES.projects.board.path,
  },
  {
    description: "Keep milestones, dependencies, and larger bets tied to the same project hub.",
    icon: MapIcon,
    id: "roadmap",
    label: "Roadmap",
    route: ROUTES.projects.roadmap.path,
  },
  {
    description: "Track dates, due windows, and release timing without leaving the project.",
    icon: Calendar,
    id: "calendar",
    label: "Calendar",
    route: ROUTES.projects.calendar.path,
  },
] as const;

const SINGLE_PROJECT_EXPANSION_SIGNALS = [
  "Add a second project once a team needs its own backlog or release cycle.",
  "Split projects by client or product area when ownership stops being shared.",
  "Use a new project when reporting, planning, or delivery timing needs diverge.",
] as const;

function getSingleProjectHighlights(issueCount: number) {
  return [
    {
      description: "Review backlog, move work across the board, and keep delivery visible.",
      title: "Delivery",
      value: `${issueCount} active issues`,
    },
    {
      description: "Keep planning, docs, and timing tied to the same project hub.",
      title: "Coverage",
      value: "Board, roadmap, calendar",
    },
  ] as const;
}

function ProjectCard({ project, orgSlug }: { project: ProjectListItem; orgSlug: string }) {
  const projectParams = { key: project.key, orgSlug };

  return (
    <Link to={ROUTES.projects.board.path} params={projectParams} className="group">
      <Card hoverable padding="lg" variant="default" className="h-full overflow-hidden">
        <Flex direction="column" gap="md">
          <Flex justify="between" align="start" gap="md">
            <Flex align="center" gap="md" className="min-w-0">
              <div className={cn(getCardRecipeClassName("projectKeyTile"), "size-10 shrink-0")}>
                <Flex align="center" justify="center" className="h-full">
                  <Typography variant="label" className="text-brand">
                    {project.key.substring(0, 2).toUpperCase()}
                  </Typography>
                </Flex>
              </div>
              <Typography variant="h3" className="truncate">
                {project.name}
              </Typography>
            </Flex>
            <Typography variant="meta" className="shrink-0 font-mono text-ui-text-tertiary">
              {project.key}
            </Typography>
          </Flex>

          {project.description ? (
            <Typography variant="p" color="secondary" className="line-clamp-2">
              {project.description}
            </Typography>
          ) : null}

          <Metadata size="sm">
            <MetadataItem>{project.issueCount || 0} issues</MetadataItem>
            <MetadataItem>{project.boardType === "kanban" ? "Kanban" : "Scrum"}</MetadataItem>
          </Metadata>
        </Flex>
      </Card>
    </Link>
  );
}

function SingleProjectWorkspacePanels({
  issueCount,
  onCreateClick,
  orgSlug,
  projectKey,
}: {
  issueCount: number;
  onCreateClick: () => void;
  orgSlug: string;
  projectKey: string;
}) {
  const projectParams = { key: projectKey, orgSlug };

  return (
    <Grid cols={1} colsLg={12} gap="lg">
      <div className="lg:col-span-7">
        <DashboardPanel surface="inset" className="h-full">
          <DashboardPanelHeader
            title="Connected surfaces"
            description="Keep execution, planning, and timing on the same project instead of bouncing between separate tools."
          />
          <DashboardPanelBody>
            <Grid cols={1} colsMd={3} gap="md">
              {SINGLE_PROJECT_SURFACES.map((surface) => (
                <Card
                  key={surface.id}
                  recipe="overlayInset"
                  variant="section"
                  padding="md"
                  className="h-full"
                >
                  <Stack gap="md" className="h-full">
                    <Stack gap="xs">
                      <Flex align="center" gap="sm">
                        <Icon icon={surface.icon} tone="brand" size="sm" />
                        <Typography variant="label">{surface.label}</Typography>
                      </Flex>
                      <Typography variant="small" color="secondary">
                        {surface.description}
                      </Typography>
                    </Stack>

                    <Button asChild variant="outline" size="sm" className="mt-auto w-full">
                      <Link to={surface.route} params={projectParams}>
                        Open {surface.label}
                      </Link>
                    </Button>
                  </Stack>
                </Card>
              ))}
            </Grid>
          </DashboardPanelBody>
        </DashboardPanel>
      </div>

      <div className="lg:col-span-5">
        <DashboardPanel surface="inset" className="h-full">
          <DashboardPanelHeader
            title="Workspace coverage"
            description="The first project should already read like a real delivery hub, not an underfilled placeholder."
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={onCreateClick}
                leftIcon={<Icon icon={Plus} size="sm" />}
              >
                Add project
              </Button>
            }
          />
          <DashboardPanelBody>
            <Stack gap="md">
              <Grid cols={1} colsSm={2} gap="md">
                {getSingleProjectHighlights(issueCount).map((item) => (
                  <Card key={item.title} recipe="overlayInset" variant="section" padding="md">
                    <Stack gap="xs">
                      <Typography variant="eyebrowWide">{item.title}</Typography>
                      <Typography variant="h4">{item.value}</Typography>
                      <Typography variant="small" color="secondary">
                        {item.description}
                      </Typography>
                    </Stack>
                  </Card>
                ))}
              </Grid>

              <Card recipe="overlayInset" variant="section" padding="md">
                <Stack gap="sm">
                  <Typography variant="label">When to add another project</Typography>
                  <Stack as="ul" gap="xs" className="list-disc pl-5">
                    {SINGLE_PROJECT_EXPANSION_SIGNALS.map((signal) => (
                      <Typography key={signal} as="li" variant="small" color="secondary">
                        {signal}
                      </Typography>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            </Stack>
          </DashboardPanelBody>
        </DashboardPanel>
      </div>
    </Grid>
  );
}

function SingleProjectWorkspaceOverview({
  onCreateClick,
  orgSlug,
  project,
}: {
  onCreateClick: () => void;
  orgSlug: string;
  project: ProjectListItem;
}) {
  const projectParams = { key: project.key, orgSlug };

  return (
    <Stack gap="lg">
      <Card variant="elevated" padding="none" className="overflow-hidden">
        <Flex direction="column" gap="none">
          <div className={cn(getCardRecipeClassName("projectFeatureStrip"), "px-4 py-4 sm:px-6")}>
            <Flex align="center" justify="between" gap="md" wrap>
              <Flex align="center" gap="sm" wrap>
                <Badge variant="secondary" shape="pill">
                  Primary workspace project
                </Badge>
                <Typography variant="small" color="secondary">
                  One hub for backlog, roadmap, and delivery timing.
                </Typography>
              </Flex>
              <Metadata size="sm">
                <MetadataItem>{project.issueCount || 0} issues</MetadataItem>
                <MetadataItem>
                  {project.boardType === "kanban" ? "Kanban" : "Scrum"} workflow
                </MetadataItem>
                <MetadataItem>Active workspace anchor</MetadataItem>
              </Metadata>
            </Flex>
          </div>

          <div className="p-5 sm:p-6">
            <Grid cols={1} colsLg={12} gap="lg" className="items-start">
              <div className="lg:col-span-8">
                <Stack gap="lg">
                  <Flex justify="between" align="start" gap="md">
                    <Flex align="center" gap="md">
                      <div
                        className={cn(getCardRecipeClassName("projectKeyTile"), "size-12 shrink-0")}
                      >
                        <Flex align="center" justify="center" className="h-full">
                          <Typography variant="h4" className="text-brand">
                            {project.key.substring(0, 2).toUpperCase()}
                          </Typography>
                        </Flex>
                      </div>
                      <FlexItem flex="1" className="overflow-hidden">
                        <Stack gap="xs">
                          <Typography variant="h2" className="truncate">
                            {project.name}
                          </Typography>
                          <Typography variant="meta" className="font-mono text-ui-text-tertiary">
                            {project.key}
                          </Typography>
                        </Stack>
                      </FlexItem>
                    </Flex>
                  </Flex>

                  <Typography variant="p" color="secondary">
                    {project.description ||
                      "Use this project as the single hub for issue triage, planning milestones, and delivery timing instead of splitting work across disconnected boards."}
                  </Typography>

                  <Flex gap="sm" wrap>
                    <Button asChild variant="primary" size="sm">
                      <Link to={ROUTES.projects.board.path} params={projectParams}>
                        Open Board
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={ROUTES.projects.roadmap.path} params={projectParams}>
                        Open Roadmap
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={ROUTES.projects.calendar.path} params={projectParams}>
                        Open Calendar
                      </Link>
                    </Button>
                  </Flex>
                </Stack>
              </div>

              <div className="lg:col-span-4">
                <Card recipe="overlayInset" variant="section" padding="md">
                  <Stack gap="md">
                    <Typography variant="label">Workspace snapshot</Typography>
                    <Grid cols={2} gap="md">
                      <Card recipe="overlayInset" variant="section" padding="sm">
                        <Stack gap="xs">
                          <Typography variant="eyebrowWide">Issues</Typography>
                          <Typography variant="h4">{project.issueCount || 0}</Typography>
                          <Typography variant="small" color="secondary">
                            Active work tied to this project.
                          </Typography>
                        </Stack>
                      </Card>
                      <Card recipe="overlayInset" variant="section" padding="sm">
                        <Stack gap="xs">
                          <Typography variant="eyebrowWide">Workflow</Typography>
                          <Typography variant="h4">
                            {project.boardType === "kanban" ? "Kanban" : "Scrum"}
                          </Typography>
                          <Typography variant="small" color="secondary">
                            Delivery model used across the hub.
                          </Typography>
                        </Stack>
                      </Card>
                    </Grid>
                    <Typography variant="small" color="secondary">
                      The first project should already feel like a complete workspace surface, not a
                      sparse list page waiting for filler cards.
                    </Typography>
                  </Stack>
                </Card>
              </div>
            </Grid>
          </div>
        </Flex>
      </Card>

      <SingleProjectWorkspacePanels
        issueCount={project.issueCount || 0}
        onCreateClick={onCreateClick}
        orgSlug={orgSlug}
        projectKey={project.key}
      />
    </Stack>
  );
}

export function ProjectsList({ onCreateClick }: ProjectsListProps) {
  const { organizationId, orgSlug } = useOrganization();
  const { canAct } = useAuthReady();

  const {
    results: projects,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.projects.getCurrentUserProjects as PaginatedQuery,
    canAct ? { organizationId } : "skip",
    { initialNumItems: 20 },
  );

  if (status === "LoadingFirstPage") {
    return <PageContent isLoading={true}>Loading projects</PageContent>;
  }

  const hasSingleProject = projects.length === 1;
  const featuredProject = hasSingleProject ? projects[0] : null;

  return (
    <Flex direction="column" gap="lg">
      {projects.length === 0 ? (
        <Flex direction="column" gap="lg">
          <EmptyState
            icon={Folder}
            title="No projects yet"
            description="Create your first project to organize work"
            className="min-h-64 w-full max-w-2xl border-dashed bg-linear-to-b from-ui-bg-elevated to-ui-bg-secondary/80 sm:min-h-72"
            action={
              <Button variant="primary" onClick={onCreateClick}>
                + Create Project
              </Button>
            }
          />

          <Grid cols={1} colsLg={3} gap="lg" className="w-full">
            {EMPTY_PROJECT_STATE_TIPS.map((tip) => (
              <Card key={tip.title} variant="soft" padding="lg">
                <Flex direction="column" gap="sm">
                  <Typography variant="label">{tip.title}</Typography>
                  <Typography variant="small" color="secondary">
                    {tip.description}
                  </Typography>
                </Flex>
              </Card>
            ))}
          </Grid>
        </Flex>
      ) : hasSingleProject && featuredProject ? (
        <SingleProjectWorkspaceOverview
          project={featuredProject}
          orgSlug={orgSlug}
          onCreateClick={onCreateClick}
        />
      ) : (
        <Grid cols={1} colsLg={2} gap="xl">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} orgSlug={orgSlug} />
          ))}
        </Grid>
      )}

      {status === "CanLoadMore" ? (
        <Flex justify="center" className="mt-8">
          <Button variant="outline" onClick={() => loadMore(20)}>
            Load More Projects
          </Button>
        </Flex>
      ) : null}
    </Flex>
  );
}
