import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CreateProjectFromTemplate } from "@/components/CreateProjectFromTemplate";
import { PageHeader, PageLayout } from "@/components/layout";
import { ProjectsList } from "@/components/ProjectsList";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { orgSlug } = useOrganization();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleProjectCreated = async (_projectId: string, projectKey: string): Promise<void> => {
    setIsCreateOpen(false);
    await navigate({
      to: ROUTES.projects.board.path,
      params: { orgSlug, key: projectKey },
    });
  };

  return (
    <PageLayout>
      <PageHeader
        title="Projects"
        description="Manage your projects and initiatives"
        actions={
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            + Create Project
          </Button>
        }
      />
      <ProjectsList onCreateClick={() => setIsCreateOpen(true)} />
      <CreateProjectFromTemplate
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onProjectCreated={handleProjectCreated}
      />
    </PageLayout>
  );
}
