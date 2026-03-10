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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Metadata, MetadataItem } from "@/components/ui/Metadata";
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
  boardType: string;
}

function SingleProjectHighlights({ issueCount }: { issueCount: number }) {
  return (
    <Grid cols={1} colsSm={3} gap="md">
      <Card variant="soft" padding="md" className="h-full">
        <Flex direction="column" gap="xs">
          <Typography variant="caption" className="uppercase tracking-widest">
            Delivery
          </Typography>
          <Typography variant="h4">{issueCount} active issues</Typography>
          <Typography variant="small" color="secondary">
            Review backlog, move work across the board, and keep delivery visible.
          </Typography>
        </Flex>
      </Card>
      <Card variant="soft" padding="md" className="h-full">
        <Flex direction="column" gap="xs">
          <Typography variant="caption" className="uppercase tracking-widest">
            Views
          </Typography>
          <Typography variant="h4">Board, roadmap, calendar</Typography>
          <Typography variant="small" color="secondary">
            One workspace entry point for planning, execution, and timing.
          </Typography>
        </Flex>
      </Card>
      <Card variant="soft" padding="md" className="h-full">
        <Flex direction="column" gap="xs">
          <Typography variant="caption" className="uppercase tracking-widest">
            Next step
          </Typography>
          <Typography variant="h4">Open the board</Typography>
          <Typography variant="small" color="secondary">
            Continue triage, create issues, or jump into project settings.
          </Typography>
        </Flex>
      </Card>
    </Grid>
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
  return (
    <Link to={ROUTES.projects.board.path} params={{ orgSlug, key: project.key }} className="group">
      <Card
        hoverable
        padding={hasSingleProject ? "xl" : "lg"}
        variant={hasSingleProject ? "elevated" : "default"}
        className="h-full overflow-hidden"
      >
        <Flex direction="column" gap={hasSingleProject ? "lg" : "md"}>
          {hasSingleProject && (
            <Flex
              align="center"
              justify="between"
              className="rounded-2xl border border-ui-border/60 bg-ui-bg-soft/80 px-4 py-3"
            >
              <Flex direction="column" gap="xs">
                <Typography variant="label">Primary workspace project</Typography>
                <Typography variant="small" color="secondary">
                  Open the board to manage backlog, roadmap, calendar, and delivery in one place.
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

          {hasSingleProject && <SingleProjectHighlights issueCount={project.issueCount || 0} />}

          <Metadata size="sm">
            <MetadataItem>{project.issueCount || 0} issues</MetadataItem>
            <MetadataItem>{project.boardType === "kanban" ? "Kanban" : "Scrum"}</MetadataItem>
            {hasSingleProject && <MetadataItem>Open board to continue</MetadataItem>}
          </Metadata>
        </Flex>
      </Card>
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
            <Card variant="soft" padding="lg">
              <Flex direction="column" gap="sm">
                <Typography variant="label">Start with structure</Typography>
                <Typography variant="small" color="secondary">
                  Set up one project per initiative so priorities, docs, and delivery work stay in
                  the same place.
                </Typography>
              </Flex>
            </Card>
            <Card variant="soft" padding="lg">
              <Flex direction="column" gap="sm">
                <Typography variant="label">Keep ownership visible</Typography>
                <Typography variant="small" color="secondary">
                  Use projects to group issues by team, product area, or client engagement instead
                  of scattering work across boards.
                </Typography>
              </Flex>
            </Card>
            <Card variant="soft" padding="lg">
              <Flex direction="column" gap="sm">
                <Typography variant="label">Build momentum fast</Typography>
                <Typography variant="small" color="secondary">
                  Once the first project exists, your backlog, roadmap, calendar, and analytics
                  views become much easier to navigate.
                </Typography>
              </Flex>
            </Card>
          </Grid>
        </Flex>
      ) : (
        <Grid
          cols={1}
          colsLg={hasSingleProject ? 1 : 2}
          gap="xl"
          className={hasSingleProject ? "max-w-4xl" : ""}
        >
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
