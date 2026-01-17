import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";

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

  if (workspaces === undefined) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
        <LoadingSpinner />
      </Flex>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Flex direction="column" gap="lg">
        {/* Header */}
        <Flex justify="between" align="center">
          <div>
            <Typography variant="h1">Workspaces</Typography>
            <Typography variant="p" color="secondary">
              Organize your organization into departments and teams
            </Typography>
          </div>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            + Create Workspace
          </Button>
        </Flex>

        <CreateWorkspaceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleWorkspaceCreated}
        />

        {/* Workspaces Grid */}
        {workspaces.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="No workspaces yet"
            description="Create your first workspace to organize teams and projects"
            action={
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                + Create Workspace
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces?.map((workspace: Doc<"workspaces">) => (
              <Link
                key={workspace._id}
                to={ROUTES.workspaces.detail.path}
                params={{ orgSlug, workspaceSlug: workspace.slug }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <Flex direction="column" gap="md">
                    <Flex align="center" gap="sm">
                      {workspace.icon && <span className="text-3xl">{workspace.icon}</span>}
                      <Typography variant="h3">{workspace.name}</Typography>
                    </Flex>

                    {workspace.description && (
                      <Typography variant="p" color="secondary">
                        {workspace.description}
                      </Typography>
                    )}

                    <Flex gap="md" className="text-sm text-gray-500">
                      <span>0 teams</span>
                      <span>•</span>
                      <span>0 projects</span>
                    </Flex>
                  </Flex>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Flex>
    </div>
  );
}
