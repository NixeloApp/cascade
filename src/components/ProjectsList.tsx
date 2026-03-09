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
        <Grid cols={1} colsLg={2} gap="xl">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={ROUTES.projects.board.path}
              params={{ orgSlug, key: project.key }}
              className="group"
            >
              <Card hoverable padding="lg" className="h-full">
                <Flex direction="column" gap="md">
                  {/* Project header with avatar and key */}
                  <Flex justify="between" align="start" gap="md">
                    <Flex align="center" gap="md">
                      {/* Project avatar/icon */}
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

                  {/* Description */}
                  {project.description && (
                    <Typography variant="p" color="secondary" className="line-clamp-2">
                      {project.description}
                    </Typography>
                  )}

                  {/* Metadata */}
                  <Metadata size="sm">
                    <MetadataItem>{project.issueCount || 0} issues</MetadataItem>
                    <MetadataItem>
                      {project.boardType === "kanban" ? "Kanban" : "Scrum"}
                    </MetadataItem>
                  </Metadata>
                </Flex>
              </Card>
            </Link>
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
