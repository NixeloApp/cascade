import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Grid } from "@/components/ui/Grid";
import { OverviewBand } from "@/components/ui/OverviewBand";
import { Stack } from "@/components/ui/Stack";
import { WorkspaceCard } from "@/components/Workspaces/WorkspaceCard";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { Building2 } from "@/lib/icons";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/")({
  component: WorkspacesList,
});

function WorkspacesList() {
  const { organizationId, orgSlug } = useOrganization();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const workspaces = useAuthenticatedQuery(api.workspaces.list, { organizationId });
  const workspaceCount = workspaces?.length ?? 0;
  const totalTeams = workspaces?.reduce((sum, workspace) => sum + workspace.teamCount, 0) ?? 0;
  const totalProjects =
    workspaces?.reduce((sum, workspace) => sum + workspace.projectCount, 0) ?? 0;
  const isCompactOverview = workspaceCount <= 1;
  const gridColumns = workspaceCount > 1 ? 2 : 1;
  const pageWidth = isCompactOverview ? "md" : "lg";

  const handleWorkspaceCreated = (slug: string) => {
    navigate({
      to: ROUTES.workspaces.teams.list.path,
      params: { orgSlug, workspaceSlug: slug },
    });
  };

  const overviewMetrics = [
    { label: "Workspaces", value: workspaceCount },
    { label: "Teams", value: totalTeams },
    { label: "Projects", value: totalProjects },
  ];

  return (
    <PageLayout maxWidth={pageWidth}>
      <PageHeader
        title="Workspaces"
        description="Organize your teams and projects into departments"
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
        {isCompactOverview ? (
          <Stack gap="xl">
            <OverviewBand
              eyebrow="Workspace map"
              title="Structure teams before work gets scattered."
              description="Use workspaces to group departments, keep related projects together, and route ownership cleanly across the organization."
              metrics={overviewMetrics}
            />

            <Grid cols={1} colsMd={gridColumns} gap="xl">
              {workspaces?.map((workspace) => (
                <WorkspaceCard
                  key={workspace._id}
                  orgSlug={orgSlug}
                  workspace={workspace}
                  compact
                />
              ))}
            </Grid>
          </Stack>
        ) : (
          <Grid cols={1} colsLg={12} gap="xl">
            <div className="lg:col-span-7">
              <Grid cols={1} colsMd={gridColumns} gap="xl">
                {workspaces?.map((workspace) => (
                  <WorkspaceCard key={workspace._id} orgSlug={orgSlug} workspace={workspace} />
                ))}
              </Grid>
            </div>

            <div className="lg:col-span-5">
              <OverviewBand
                eyebrow="Operating structure"
                title="Keep ownership obvious as your org grows."
                description="Use workspaces as the top-level map for departments, business units, or client pods so people know where projects belong."
                metrics={overviewMetrics}
              />
            </div>
          </Grid>
        )}
      </PageContent>
    </PageLayout>
  );
}
