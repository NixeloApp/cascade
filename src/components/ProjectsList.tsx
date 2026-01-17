import { api } from "@convex/_generated/api";
import { Link, useNavigate } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { CreateProjectFromTemplate } from "./CreateProjectFromTemplate";

export function ProjectsList() {
  const { organizationId, orgSlug } = useOrganization();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Paginated projects list
  const {
    results: projects,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.projects.getCurrentUserProjects,
    { organizationId },
    { initialNumItems: 20 },
  );

  const handleProjectCreated = async (_projectId: string, projectKey: string) => {
    setIsCreateOpen(false);
    await navigate({
      to: ROUTES.projects.board.path,
      params: { orgSlug, key: projectKey },
    });
  };

  if (status === "LoadingFirstPage") {
    return (
      <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
        <LoadingSpinner />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="lg">
      {/* Header */}
      <Flex justify="between" align="center">
        <div>
          <Typography variant="h2">Projects</Typography>
          <Typography variant="p" color="secondary">
            Manage your projects and initiatives
          </Typography>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          + Create Project
        </Button>
      </Flex>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects yet"
          description="Create your first project to organize work"
          action={
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
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
            >
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <Flex direction="column" gap="md">
                  <Flex justify="between" align="start">
                    <Typography variant="h3">{project.name}</Typography>
                    <Typography variant="inlineCode">{project.key}</Typography>
                  </Flex>

                  {project.description && (
                    <Typography variant="p" color="secondary" className="line-clamp-2">
                      {project.description}
                    </Typography>
                  )}

                  <Typography variant="muted" className="text-sm">
                    {project.myIssues || 0} issues •{" "}
                    {project.boardType === "kanban" ? "Kanban" : "Scrum"}
                  </Typography>
                </Flex>
              </Card>
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

      <CreateProjectFromTemplate
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onProjectCreated={handleProjectCreated}
      />
    </Flex>
  );
}
