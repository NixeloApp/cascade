import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/")({
  component: TeamsList,
});

function TeamsList() {
  const { organizationId, orgSlug } = useOrganization();
  const { workspaceSlug } = Route.useParams();

  const workspace = useQuery(api.workspaces.getBySlug, {
    organizationId,
    slug: workspaceSlug,
  });

  // For now, teams are organization-wide, but we'll filter by workspace later
  const {
    results: teams,
    status,
    loadMore,
  } = usePaginatedQuery(api.teams.getTeams, { organizationId }, { initialNumItems: 20 });

  if (!(workspace && teams)) {
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
          <Typography variant="h2">Teams</Typography>
          <Typography variant="p" color="secondary">
            Organize your workspace into focused teams
          </Typography>
        </div>
        <Button variant="primary">+ Create Team</Button>
      </Flex>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No teams yet"
          description="Create your first team to start organizing work"
          action={<Button variant="primary">+ Create Team</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team: Doc<"teams">) => (
            <Link
              key={team._id}
              to={ROUTES.workspaces.teams.detail.path}
              params={{ orgSlug, workspaceSlug, teamSlug: team.slug }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <Flex direction="column" gap="md">
                  <Flex align="center" gap="sm">
                    {team.icon && <span className="text-3xl">{team.icon}</span>}
                    <Typography variant="h3">{team.name}</Typography>
                  </Flex>

                  {team.description && (
                    <Typography variant="p" color="secondary">
                      {team.description}
                    </Typography>
                  )}

                  <Flex gap="md" className="text-sm text-gray-500">
                    <span>0 members</span>
                    <span>•</span>
                    <span>0 projects</span>
                  </Flex>
                </Flex>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {status === "CanLoadMore" && (
        <Flex justify="center" className="mt-8">
          <Button variant="outline" onClick={() => loadMore(20)}>
            Load More Teams
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
