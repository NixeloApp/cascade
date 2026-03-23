/**
 * Workspace Card
 *
 * Displays a workspace summary with team/project counts and navigation link.
 * Supports compact (single workspace) and standard (multi-workspace grid) layouts.
 */

import type { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { ROUTES } from "@/config/routes";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { IconCircle } from "../ui/IconCircle";
import { InsetPanel } from "../ui/InsetPanel";
import { Metadata, MetadataItem } from "../ui/Metadata";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

export type WorkspaceListItem = FunctionReturnType<typeof api.workspaces.list>[number];

export interface WorkspaceCardProps {
  orgSlug: string;
  workspace: WorkspaceListItem;
  compact?: boolean;
}

function WorkspaceIcon({ icon }: { icon: string | undefined }) {
  if (!icon) return null;
  return (
    <IconCircle
      size="md"
      variant="soft"
      className="size-12 border border-ui-border/60 text-2xl shadow-soft"
    >
      <span aria-hidden="true">{icon}</span>
    </IconCircle>
  );
}

function WorkspaceMetrics({
  teamCount,
  projectCount,
}: {
  teamCount: number;
  projectCount: number;
}) {
  return (
    <Grid cols={2} gap="sm">
      <InsetPanel>
        <Stack gap="sm">
          <Typography variant="metricLabel">Teams</Typography>
          <Typography variant="h5">{teamCount}</Typography>
        </Stack>
      </InsetPanel>
      <InsetPanel>
        <Stack gap="sm">
          <Typography variant="metricLabel">Projects</Typography>
          <Typography variant="h5">{projectCount}</Typography>
        </Stack>
      </InsetPanel>
    </Grid>
  );
}

function WorkspaceFooter({ workspace }: { workspace: WorkspaceListItem }) {
  return (
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
}

function WorkspaceDescription({ text }: { text: string | undefined }) {
  return (
    <Typography variant="small" color="secondary" className="max-w-2xl">
      {text || "Group related teams and projects to keep ownership visible as the org grows."}
    </Typography>
  );
}

export function WorkspaceCard({ orgSlug, workspace, compact = false }: WorkspaceCardProps) {
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
              <Flex align="center" gap="sm">
                <WorkspaceIcon icon={workspace.icon} />
                <Stack gap="sm">
                  <Typography variant="h4">{workspace.name}</Typography>
                  <Badge variant="outline" shape="pill">
                    {workspace.slug}
                  </Badge>
                </Stack>
              </Flex>

              <WorkspaceDescription text={workspace.description} />
            </Flex>

            <Stack gap="sm" className="lg:col-span-5">
              <WorkspaceMetrics
                teamCount={workspace.teamCount}
                projectCount={workspace.projectCount}
              />
              <WorkspaceFooter workspace={workspace} />
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
              <WorkspaceIcon icon={workspace.icon} />
              <div>
                <Typography variant="h4">{workspace.name}</Typography>
                <Typography variant="caption">Workspace</Typography>
              </div>
            </Flex>
            <Badge variant="outline" shape="pill">
              {workspace.teamCount} {workspace.teamCount === 1 ? "team" : "teams"}
            </Badge>
          </Flex>

          <WorkspaceDescription text={workspace.description} />

          <WorkspaceMetrics teamCount={workspace.teamCount} projectCount={workspace.projectCount} />

          <div className="mt-auto">
            <WorkspaceFooter workspace={workspace} />
          </div>
        </Flex>
      </Card>
    </Link>
  );
}
