import { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Metadata, MetadataItem } from "@/components/ui/Metadata";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { Folder } from "@/lib/icons";
import { cn } from "@/lib/utils";

// Type helper for paginated queries with custom return types
type PaginatedQuery = FunctionReference<"query", "public">;

interface ProjectsListProps {
  onCreateClick: () => void;
}

export function ProjectsList({ onCreateClick }: ProjectsListProps) {
  const { organizationId, orgSlug } = useOrganization();

  // Paginated projects list
  const {
    results: projects,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.projects.getCurrentUserProjects as PaginatedQuery,
    { organizationId },
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
        <EmptyState
          icon={Folder}
          title="No projects yet"
          description="Create your first project to organize work"
          action={
            <Button variant="primary" onClick={onCreateClick}>
              + Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={ROUTES.projects.board.path}
              params={{ orgSlug, key: project.key }}
              className="group"
            >
              <div
                className={cn(
                  "card-subtle p-6 cursor-pointer",
                  "transform transition-all duration-200",
                  "hover:scale-[var(--scale-hover-subtle)]",
                )}
              >
                <Flex direction="column" gap="md">
                  {/* Project header with avatar and key */}
                  <Flex justify="between" align="start" gap="md">
                    <Flex align="center" gap="md">
                      {/* Project avatar/icon */}
                      <Flex
                        align="center"
                        justify="center"
                        className="w-10 h-10 rounded-lg bg-brand/10 text-brand font-semibold text-sm shrink-0 ring-1 ring-brand/20 group-hover:ring-brand/40 transition-all"
                      >
                        {project.key.substring(0, 2).toUpperCase()}
                      </Flex>
                      <Typography
                        variant="h3"
                        className="tracking-tight group-hover:text-brand transition-colors"
                      >
                        {project.name}
                      </Typography>
                    </Flex>
                    <Typography
                      variant="inlineCode"
                      className="text-ui-text-tertiary text-xs shrink-0"
                    >
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
              </div>
            </Link>
          ))}
        </div>
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
