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
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Metadata, MetadataItem } from "@/components/ui/Metadata";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthReady } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { Folder } from "@/lib/icons";

// Type helper for paginated queries with custom return types
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

function SingleProjectHighlights({ issueCount }: { issueCount: number }) {
  return (
    <Stack gap="md">
      <Grid cols={1} colsSm={2} colsLg={1} gap="md">
        {getSingleProjectHighlights(issueCount).map((item) => (
          <Card key={item.title} variant="soft" padding="md" className="h-full">
            <Flex direction="column" gap="xs">
              <Typography variant="caption" className="uppercase tracking-widest">
                {item.title}
              </Typography>
              <Typography variant="h4">{item.value}</Typography>
              <Typography variant="small" color="secondary">
                {item.description}
              </Typography>
            </Flex>
          </Card>
        ))}
      </Grid>
      <Card variant="default" padding="md">
        <Flex direction="column" gap="sm">
          <Typography variant="caption" className="uppercase tracking-widest">
            Workspace rhythm
          </Typography>
          <Typography variant="h4">Keep planning and execution in one lane</Typography>
          <Typography variant="small" color="secondary">
            Use this project as the anchor for issue triage, document context, calendar planning,
            and delivery updates instead of splitting those flows across separate tools.
          </Typography>
        </Flex>
      </Card>
    </Stack>
  );
}

function ProjectCard({
  project,
  hasSingleProject,
  orgSlug,
}: {
  project: ProjectListItem;
  hasSingleProject: boolean;
  orgSlug: string;
}) {
  const projectParams = { orgSlug, key: project.key };

  const cardContent = (
    <Card
      hoverable={!hasSingleProject}
      padding="lg"
      variant={hasSingleProject ? "elevated" : "default"}
      className={hasSingleProject ? "self-start overflow-hidden" : "h-full overflow-hidden"}
    >
      <Flex direction="column" gap={hasSingleProject ? "lg" : "md"}>
        {hasSingleProject && (
          <Flex
            align="center"
            justify="between"
            gap="sm"
            wrap
            className="rounded-2xl border border-ui-border/60 bg-ui-bg-soft/80 px-4 py-2.5"
          >
            <Flex align="center" gap="sm" wrap>
              <Badge variant="secondary" shape="pill">
                Primary workspace project
              </Badge>
              <Typography variant="small" color="secondary">
                Board, roadmap, calendar, and delivery in one lane.
              </Typography>
            </Flex>
            <Typography
              variant="caption"
              className="uppercase tracking-widest text-ui-text-tertiary"
            >
              Active
            </Typography>
          </Flex>
        )}

        <Flex justify="between" align="start" gap="md">
          <Flex align="center" gap="md">
            <Flex
              align="center"
              justify="center"
              className="w-10 h-10 rounded-lg bg-brand/10 text-brand font-semibold text-sm shrink-0 ring-1 ring-brand/20 transition-all"
            >
              {project.key.substring(0, 2).toUpperCase()}
            </Flex>
            <Typography variant="h3" className="tracking-tight">
              {project.name}
            </Typography>
          </Flex>
          <Typography variant="meta" className="text-ui-text-tertiary font-mono shrink-0">
            {project.key}
          </Typography>
        </Flex>

        {project.description && (
          <Typography variant="p" color="secondary" className="line-clamp-2">
            {project.description}
          </Typography>
        )}

        <Metadata size="sm">
          <MetadataItem>{project.issueCount || 0} issues</MetadataItem>
          <MetadataItem>{project.boardType === "kanban" ? "Kanban" : "Scrum"}</MetadataItem>
          {hasSingleProject && <MetadataItem>Delivery hub</MetadataItem>}
        </Metadata>

        {hasSingleProject && (
          <Stack gap="sm">
            <Typography variant="label">Jump into</Typography>
            <Flex gap="sm" wrap>
              <Button asChild variant="secondary" size="sm">
                <Link to={ROUTES.projects.board.path} params={projectParams}>
                  Board
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to={ROUTES.projects.roadmap.path} params={projectParams}>
                  Roadmap
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to={ROUTES.projects.calendar.path} params={projectParams}>
                  Calendar
                </Link>
              </Button>
            </Flex>
            <Typography variant="small" color="secondary" className="max-w-xl">
              Use this project as the workspace anchor for active issues, planning milestones, and
              delivery timing instead of splitting those flows across separate tools.
            </Typography>
          </Stack>
        )}
      </Flex>
    </Card>
  );

  if (hasSingleProject) {
    return cardContent;
  }

  return (
    <Link to={ROUTES.projects.board.path} params={projectParams} className="group">
      {cardContent}
    </Link>
  );
}

/** Paginated list of projects with create button and navigation. */
export function ProjectsList({ onCreateClick }: ProjectsListProps) {
  const { organizationId, orgSlug } = useOrganization();
  const { canAct } = useAuthReady();

  // Paginated projects list
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
    return (
      <Flex direction="column" align="center" justify="center" className="min-h-100">
        <LoadingSpinner />
      </Flex>
    );
  }

  const hasSingleProject = projects.length === 1;
  const featuredProject = hasSingleProject ? projects[0] : null;

  return (
    <Flex direction="column" gap="lg">
      {/* Projects Grid */}
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
        <Grid cols={1} colsLg={12} gap="lg" className="max-w-6xl items-start">
          <div className="lg:col-span-7">
            <ProjectCard
              key={featuredProject._id}
              project={featuredProject}
              hasSingleProject
              orgSlug={orgSlug}
            />
          </div>
          <div className="lg:col-span-5">
            <SingleProjectHighlights issueCount={featuredProject.issueCount || 0} />
          </div>
        </Grid>
      ) : (
        <Grid cols={1} colsLg={2} gap="xl">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              hasSingleProject={hasSingleProject}
              orgSlug={orgSlug}
            />
          ))}
        </Grid>
      )}

      {status === "CanLoadMore" && (
        <Flex justify="center" className="mt-8">
          <Button variant="outline" onClick={() => loadMore(20)}>
            Load More Projects
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
