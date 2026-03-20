import { api } from "@convex/_generated/api";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";

import { useState } from "react";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { IconCircle } from "@/components/ui/IconCircle";
import { InsetPanel } from "@/components/ui/InsetPanel";
import { Metadata, MetadataItem } from "@/components/ui/Metadata";
import { OverviewBand } from "@/components/ui/OverviewBand";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { Building2 } from "@/lib/icons";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/")({
  component: WorkspacesList,
});

type WorkspaceListItem = FunctionReturnType<typeof api.workspaces.list>[number];

interface WorkspaceCardProps {
  orgSlug: string;
  workspace: WorkspaceListItem;
  compact?: boolean;
}

function WorkspaceCard({ orgSlug, workspace, compact = false }: WorkspaceCardProps) {
  const footer = (
    <InsetPanel size="compact">
      <Flex align="center" justify="between" gap="md">
        <Metadata size="sm">
          <MetadataItem>
            {workspace.teamCount} {workspace.teamCount === 1 ? "team" : "teams"}
          </MetadataItem>
          <MetadataItem>
            {workspace.projectCount} {workspace.projectCount === 1 ? "project" : "projects"}
          </MetadataItem>
        </Metadata>
        <Badge variant="outline" shape="pill" className="shrink-0">
          Open workspace
        </Badge>
      </Flex>
    </InsetPanel>
  );

  if (compact) {
    return (
      <Link
        to={ROUTES.workspaces.detail.path}
        params={{ orgSlug, workspaceSlug: workspace.slug }}
        className="block h-full"
      >
        <Card hoverable padding="lg" className="h-full">
          <Grid cols={1} colsLg={12} gap="lg">
            <Flex direction="column" gap="lg" className="lg:col-span-7">
              <Flex align="start" justify="between" gap="md">
                <Flex align="center" gap="sm">
                  {workspace.icon && (
                    <IconCircle
                      size="md"
                      variant="soft"
                      className="h-12 w-12 border border-ui-border/60 text-2xl shadow-soft"
                    >
                      <span aria-hidden="true">{workspace.icon}</span>
                    </IconCircle>
                  )}
                  <div>
                    <Typography variant="h4">{workspace.name}</Typography>
                    <Flex align="center" gap="sm" wrap className="mt-2">
                      <Badge variant="secondary" shape="pill">
                        Workspace
                      </Badge>
                      <Badge variant="outline" shape="pill">
                        {workspace.slug}
                      </Badge>
                    </Flex>
                  </div>
                </Flex>
                <Badge variant="outline" shape="pill">
                  {workspace.teamCount} {workspace.teamCount === 1 ? "team" : "teams"}
                </Badge>
              </Flex>

              <Typography variant="small" color="secondary" className="max-w-2xl">
                {workspace.description ||
                  "Group related teams and projects here so ownership stays visible as the organization grows."}
              </Typography>

              <Typography variant="caption" color="secondary" className="max-w-xl">
                This workspace acts as the primary operating lane for its teams, projects, and
                calendar views.
              </Typography>
            </Flex>

            <Stack gap="sm" className="lg:col-span-5">
              <Grid cols={2} gap="sm">
                <InsetPanel>
                  <Typography variant="metricLabel">Teams</Typography>
                  <Typography variant="h5" className="mt-2">
                    {workspace.teamCount}
                  </Typography>
                </InsetPanel>
                <InsetPanel>
                  <Typography variant="metricLabel">Projects</Typography>
                  <Typography variant="h5" className="mt-2">
                    {workspace.projectCount}
                  </Typography>
                </InsetPanel>
              </Grid>

              {footer}
            </Stack>
          </Grid>
        </Card>
      </Link>
    );
  }

  return (
    <Link
      to={ROUTES.workspaces.detail.path}
      params={{ orgSlug, workspaceSlug: workspace.slug }}
      className="block h-full"
    >
      <Card hoverable padding="lg" className="h-full">
        <Flex direction="column" gap="lg" className="h-full">
          <Flex align="start" justify="between" gap="md">
            <Flex align="center" gap="sm">
              {workspace.icon && (
                <IconCircle
                  size="md"
                  variant="soft"
                  className="h-12 w-12 border border-ui-border/60 text-2xl shadow-soft"
                >
                  <span aria-hidden="true">{workspace.icon}</span>
                </IconCircle>
              )}
              <div>
                <Typography variant="h4">{workspace.name}</Typography>
                <Typography variant="caption">Workspace</Typography>
              </div>
            </Flex>
            <Badge variant="outline" shape="pill">
              {workspace.teamCount} {workspace.teamCount === 1 ? "team" : "teams"}
            </Badge>
          </Flex>

          <Typography variant="small" color="secondary" className="max-w-2xl">
            {workspace.description ||
              "Group related teams and projects here so ownership stays visible as the organization grows."}
          </Typography>

          <Grid cols={2} gap="sm">
            <InsetPanel>
              <Typography variant="metricLabel">Teams</Typography>
              <Typography variant="h5" className="mt-2">
                {workspace.teamCount}
              </Typography>
            </InsetPanel>
            <InsetPanel>
              <Typography variant="metricLabel">Projects</Typography>
              <Typography variant="h5" className="mt-2">
                {workspace.projectCount}
              </Typography>
            </InsetPanel>
          </Grid>

          <div className="mt-auto">{footer}</div>
        </Flex>
      </Card>
    </Link>
  );
}

function WorkspacesList() {
  const { organizationId, orgSlug } = useOrganization();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const workspaces = useAuthenticatedQuery(api.workspaces.list, { organizationId });
  const workspaceCount = workspaces?.length ?? 0;
  const totalTeams = workspaces?.reduce((sum, workspace) => sum + workspace.teamCount, 0) ?? 0;
  const totalProjects =
    workspaces?.reduce((sum, workspace) => sum + workspace.projectCount, 0) ?? 0;
  const gridColumns = workspaceCount > 1 ? 2 : 1;
  const isCompactOverview = workspaceCount <= 1;
  const pageWidth = isCompactOverview ? "md" : "lg";

  const handleWorkspaceCreated = (slug: string) => {
    navigate({
      to: ROUTES.workspaces.teams.list.path,
      params: { orgSlug, workspaceSlug: slug },
    });
  };

  return (
    <PageLayout maxWidth={pageWidth}>
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
        {isCompactOverview ? (
          <Stack gap="xl">
            <OverviewBand
              eyebrow="Workspace map"
              title="Structure teams before work gets scattered."
              description="Use workspaces to group departments, keep related projects together, and route ownership cleanly across the organization."
              metrics={[
                { label: "Workspaces", value: workspaceCount, detail: "Operating areas" },
                { label: "Teams", value: totalTeams, detail: "Grouped beneath them" },
                { label: "Projects", value: totalProjects, detail: "Routed by ownership" },
              ]}
              aside={
                <Stack gap="sm">
                  <Typography variant="label">Recommended next step</Typography>
                  <Typography variant="small" color="secondary">
                    Create one workspace for each durable operating area, then branch teams
                    underneath it instead of flattening everything into the sidebar.
                  </Typography>
                </Stack>
              }
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
                title="Keep ownership obvious before the org gets noisy."
                description="Use workspaces as the durable top-level map for departments, business units, or client delivery pods so people know where projects belong."
                metrics={[
                  { label: "Workspaces", value: workspaceCount, detail: "Primary lanes" },
                  { label: "Teams", value: totalTeams, detail: "Organized beneath them" },
                  { label: "Projects", value: totalProjects, detail: "Mapped to clear homes" },
                ]}
                aside={
                  <Stack gap="sm">
                    <Typography variant="label">Design principle</Typography>
                    <Typography variant="small" color="secondary">
                      Keep the number of workspaces low and durable. Teams and projects can shift
                      more often, but the workspace map should remain legible over time.
                    </Typography>
                  </Stack>
                }
              />
            </div>
          </Grid>
        )}
      </PageContent>
    </PageLayout>
  );
}
