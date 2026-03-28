/**
 * Sidebar Team Item
 *
 * Expandable sidebar item for workspace teams.
 * Lazy loads team projects on expansion.
 * Supports navigation to team board and settings.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link, useLocation } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import type { FunctionReference, FunctionReturnType } from "convex/server";
import { Button } from "@/components/ui/Button";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { NavItem } from "@/components/ui/NavItem";
import { Stack } from "@/components/ui/Stack";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { ChevronDown, ChevronRight } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";

type PaginatedQuery = FunctionReference<"query", "public">;

interface SidebarTeamItemProps {
  team: FunctionReturnType<typeof api.teams.listForSidebar>[number];
  workspaceSlug: string;
  orgSlug: string;
  isExpanded: boolean;
  onToggle: (slug: string) => void;
  onNavClick: () => void;
}

/** Expandable sidebar item for a team with board and settings links. */
export function SidebarTeamItem({
  team,
  workspaceSlug,
  orgSlug,
  isExpanded,
  onToggle,
  onNavClick,
}: SidebarTeamItemProps) {
  const location = useLocation();
  const teamPath = ROUTES.workspaces.teams.detail.build(orgSlug, workspaceSlug, team.slug);
  const isActive = location.pathname === teamPath || location.pathname.startsWith(`${teamPath}/`);
  const shouldShowProjects = isExpanded || isActive;

  return (
    <Card recipe="sidebarTeamBranch" variant="ghost" padding="none">
      <Flex align="center" gap="xs">
        <IconButton
          variant="ghost"
          size="xs"
          onClick={() => onToggle(team.slug)}
          aria-expanded={shouldShowProjects}
          aria-label={shouldShowProjects ? `Collapse ${team.name}` : `Expand ${team.name}`}
        >
          <Icon icon={shouldShowProjects ? ChevronDown : ChevronRight} size="sm" />
        </IconButton>
        <FlexItem flex="1">
          <Tooltip content={team.name}>
            <NavItem asChild active={isActive} size="sm">
              <Link
                to={ROUTES.workspaces.teams.detail.path}
                params={{ orgSlug, workspaceSlug, teamSlug: team.slug }}
                onClick={onNavClick}
              >
                {team.name}
              </Link>
            </NavItem>
          </Tooltip>
        </FlexItem>
      </Flex>

      {shouldShowProjects && (
        <SidebarTeamProjects teamId={team._id} orgSlug={orgSlug} onNavClick={onNavClick} />
      )}
    </Card>
  );
}

function SidebarTeamProjects({
  teamId,
  orgSlug,
  onNavClick,
}: {
  teamId: Id<"teams">;
  orgSlug: string;
  onNavClick: () => void;
}) {
  const location = useLocation();
  const {
    results: projects,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.projects.getTeamProjects as PaginatedQuery,
    { teamId },
    { initialNumItems: 10 },
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className={getCardRecipeClassName("sidebarTeamStatus")}>
        <Typography variant="caption" color="tertiary">
          Loading...
        </Typography>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className={getCardRecipeClassName("sidebarTeamStatus")}>
        <Typography variant="caption" color="tertiary">
          No projects
        </Typography>
      </div>
    );
  }

  return (
    <div className={getCardRecipeClassName("sidebarTeamProjectsRail")}>
      <Stack gap="xs">
        {projects.map((project) => {
          const projectBasePath = `${ROUTES.projects.list.build(orgSlug)}/${project.key}`;
          const isActive =
            location.pathname === projectBasePath ||
            location.pathname.startsWith(`${projectBasePath}/`);

          return (
            <div key={project._id}>
              <Tooltip content={`${project.key} - ${project.name}`}>
                <NavItem asChild active={isActive} size="sm">
                  <Link
                    to={ROUTES.projects.board.path}
                    params={{
                      orgSlug,
                      key: project.key,
                    }}
                    data-testid={TEST_IDS.NAV.PROJECT_ITEM(project.key)}
                    onClick={onNavClick}
                  >
                    {project.key} - {project.name}
                  </Link>
                </NavItem>
              </Tooltip>
            </div>
          );
        })}

        {status === "CanLoadMore" && (
          <div className={getCardRecipeClassName("sidebarTeamLoadMore")}>
            <Button variant="link" size="content" onClick={() => loadMore(10)}>
              <Typography variant="caption" color="brand">
                Load more...
              </Typography>
            </Button>
          </div>
        )}
      </Stack>
    </div>
  );
}
