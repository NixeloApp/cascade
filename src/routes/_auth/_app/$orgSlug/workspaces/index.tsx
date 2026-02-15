import { api } from "@convex/_generated/api";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Metadata, MetadataItem } from "@/components/ui/Metadata";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { Building2 } from "@/lib/icons";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/")({
  component: WorkspacesList,
});

function WorkspacesList() {
  const { organizationId, orgSlug } = useOrganization();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const workspaces = useQuery(api.workspaces.list, {
    organizationId,
  });

  const handleWorkspaceCreated = (_workspaceId: string, slug: string) => {
    navigate({
      to: ROUTES.workspaces.teams.list.path,
      params: { orgSlug, workspaceSlug: slug },
    });
  };

  return (
    <PageLayout>
      <PageHeader
        title="Workspaces"
        description="Organize your organization into departments and teams"
        actions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            + Create Workspace
          </Button>
        }
      />

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleWorkspaceCreated}
      />

      <PageContent
        isLoading={workspaces === undefined}
        isEmpty={workspaces !== undefined && workspaces.length === 0}
        emptyState={{
          icon: Building2,
          title: "No workspaces yet",
          description: "Create your first workspace to organize teams and projects",
          action: (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              + Create Workspace
            </Button>
          ),
        }}
      >
        <Grid cols={1} colsMd={2} colsLg={3} gap="xl">
          {workspaces?.map((workspace) => (
            <Link
              key={workspace._id}
              to={ROUTES.workspaces.detail.path}
              params={{ orgSlug, workspaceSlug: workspace.slug }}
            >
              <Card hoverable className="p-6">
                <Flex direction="column" gap="md">
                  <Flex align="center" gap="sm">
                    {workspace.icon && (
                      <Typography variant="h2" as="span">
                        {workspace.icon}
                      </Typography>
                    )}
                    <Typography variant="h3">{workspace.name}</Typography>
                  </Flex>

                  {workspace.description && (
                    <Typography variant="p" color="secondary">
                      {workspace.description}
                    </Typography>
                  )}

                  <Metadata size="sm">
                    <MetadataItem>
                      {workspace.teamCount} {workspace.teamCount === 1 ? "team" : "teams"}
                    </MetadataItem>
                    <MetadataItem>
                      {workspace.projectCount}{" "}
                      {workspace.projectCount === 1 ? "project" : "projects"}
                    </MetadataItem>
                  </Metadata>
                </Flex>
              </Card>
            </Link>
          ))}
        </Grid>
      </PageContent>
    </PageLayout>
  );
}
