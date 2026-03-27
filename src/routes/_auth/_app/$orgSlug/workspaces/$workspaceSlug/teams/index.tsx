import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { CreateTeamModal } from "@/components/CreateTeamModal";
import { PageContent } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Metadata, MetadataItem } from "@/components/ui/Metadata";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { Users } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { useWorkspaceLayout } from "../route";
export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/")({
  component: TeamsList,
});

export function TeamsList() {
  const { organizationId, orgSlug } = useOrganization();
  const { workspaceSlug } = Route.useParams();
  const { workspaceId } = useWorkspaceLayout();
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);

  const {
    results: teams,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.teams.getTeams,
    { organizationId, workspaceId },
    { initialNumItems: 20 },
  );

  const hasTeams = teams !== undefined && teams.length > 0;
  const openCreateTeamModal = () => setIsCreateTeamOpen(true);
  const closeCreateTeamModal = () => setIsCreateTeamOpen(false);

  return (
    <>
      <PageContent
        isLoading={teams === undefined}
        emptyState={
          teams !== undefined && teams.length === 0
            ? {
                icon: Users,
                title: "No teams yet",
                description: "Create your first team to start organizing work in this workspace.",
                actions: (
                  <Button
                    variant="primary"
                    onClick={openCreateTeamModal}
                    data-testid={TEST_IDS.WORKSPACE.CREATE_TEAM_BUTTON}
                  >
                    + Create Team
                  </Button>
                ),
              }
            : null
        }
      >
        <Stack gap="lg">
          <Flex justify="between" align="start" direction="column" directionSm="row" gap="md">
            <Stack gap="xs" className="min-w-0">
              <Typography variant="h3">Teams</Typography>
              <Typography variant="small" color="secondary">
                Group workspace members around shared boards, calendars, and wiki docs.
              </Typography>
            </Stack>
            {hasTeams ? (
              <Button
                variant="primary"
                onClick={openCreateTeamModal}
                data-testid={TEST_IDS.WORKSPACE.CREATE_TEAM_BUTTON}
              >
                + Create Team
              </Button>
            ) : null}
          </Flex>

          <Grid cols={1} colsMd={2} colsLg={3} gap="xl">
            {teams?.map((team) => (
              <Link
                key={team._id}
                to={ROUTES.workspaces.teams.detail.path}
                params={{ orgSlug, workspaceSlug, teamSlug: team.slug }}
              >
                <Card hoverable className="p-6">
                  <Flex direction="column" gap="md">
                    <Flex align="center" gap="sm">
                      {team.icon && (
                        <Typography variant="h2" as="span">
                          {team.icon}
                        </Typography>
                      )}
                      <Typography variant="h3">{team.name}</Typography>
                    </Flex>

                    {team.description && (
                      <Typography variant="p" color="secondary">
                        {team.description}
                      </Typography>
                    )}

                    <Metadata size="sm">
                      <MetadataItem>
                        {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                      </MetadataItem>
                      <MetadataItem>
                        {team.projectCount} {team.projectCount === 1 ? "project" : "projects"}
                      </MetadataItem>
                    </Metadata>
                  </Flex>
                </Card>
              </Link>
            ))}
          </Grid>

          {status === "CanLoadMore" && (
            <Flex justify="center">
              <Button variant="outline" onClick={() => loadMore(20)}>
                Load More Teams
              </Button>
            </Flex>
          )}
        </Stack>
      </PageContent>

      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        onClose={closeCreateTeamModal}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
      />
    </>
  );
}
