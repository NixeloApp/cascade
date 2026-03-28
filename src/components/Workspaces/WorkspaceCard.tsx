/**
 * Workspace Card
 *
 * Displays a workspace summary with team/project counts and navigation link.
 */

import type { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { ROUTES } from "@/config/routes";
import { TEST_IDS } from "@/lib/test-ids";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { CardSection } from "../ui/CardSection";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { IconCircle } from "../ui/IconCircle";
import { Inline } from "../ui/Inline";
import { Metadata, MetadataItem } from "../ui/Metadata";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

export type WorkspaceListItem = FunctionReturnType<typeof api.workspaces.list>[number];

export interface WorkspaceCardProps {
  orgSlug: string;
  workspace: WorkspaceListItem;
}

function WorkspaceIcon({ icon }: { icon: string | undefined }) {
  if (!icon) return null;
  return (
    <IconCircle
      size="md"
      variant="soft"
      className="border border-ui-border/60 text-2xl shadow-soft"
    >
      <Inline aria-hidden="true">{icon}</Inline>
    </IconCircle>
  );
}

export function WorkspaceCard({ orgSlug, workspace }: WorkspaceCardProps) {
  return (
    <Link
      to={ROUTES.workspaces.detail.path}
      params={{ orgSlug, workspaceSlug: workspace.slug }}
      className="block h-full"
      data-testid={TEST_IDS.WORKSPACE.CARD}
    >
      <Card hoverable padding="lg" className="h-full">
        <Flex direction="column" gap="lg" className="h-full">
          <Flex align="start" justify="between" gap="md">
            <Flex align="center" gap="sm">
              <WorkspaceIcon icon={workspace.icon} />
              <Stack gap="xs">
                <Typography variant="h4">{workspace.name}</Typography>
                {workspace.description ? (
                  <Typography variant="small" color="secondary" className="line-clamp-2">
                    {workspace.description}
                  </Typography>
                ) : null}
              </Stack>
            </Flex>
          </Flex>

          <Grid cols={2} gap="sm">
            <CardSection>
              <Stack gap="xs">
                <Typography variant="metricLabel">Teams</Typography>
                <Typography variant="h5">{workspace.teamCount}</Typography>
              </Stack>
            </CardSection>
            <CardSection>
              <Stack gap="xs">
                <Typography variant="metricLabel">Projects</Typography>
                <Typography variant="h5">{workspace.projectCount}</Typography>
              </Stack>
            </CardSection>
          </Grid>

          <div className="mt-auto">
            <CardSection size="compact">
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
            </CardSection>
          </div>
        </Flex>
      </Card>
    </Link>
  );
}
