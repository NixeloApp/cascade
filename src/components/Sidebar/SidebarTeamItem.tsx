/**
 * Sidebar Team Item
 *
 * Expandable sidebar item for workspace teams.
 * Lazy loads team projects on expansion.
 * Supports navigation to team board and settings.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Link, useLocation } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { NavItem } from "@/components/ui/NavItem";
import { Stack } from "@/components/ui/Stack";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

type PaginatedQuery = FunctionReference<"query", "public">;

interface SidebarTeamItemProps {
  team: Doc<"teams">;
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
  // Use regex to ensure we match /teams/slug exactly, or /teams/slug/...
  // but NOT /teams/slug-prefix... using word boundary or path separator check
  const isActive =
    location.pathname === `/teams/${team.slug}` ||
    location.pathname.startsWith(`/teams/${team.slug}/`);

  return (
    <Card recipe="sidebarTeamBranch" variant="ghost" padding="none">
      <Flex align="center" gap="xs">
        <IconButton
          variant="ghost"
          size="xs"
          onClick={() => onToggle(team.slug)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Collapse ${team.name}` : `Expand ${team.name}`}
        >
          <Icon icon={isExpanded ? ChevronDown : ChevronRight} size="sm" />
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

      {isExpanded && (
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
      <Card recipe="sidebarTeamStatus" variant="ghost" padding="none">
        <Typography variant="caption" color="tertiary">
          Loading...
        </Typography>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card recipe="sidebarTeamStatus" variant="ghost" padding="none">
        <Typography variant="caption" color="tertiary">
          No projects
        </Typography>
      </Card>
    );
  }

  return (
    <Card recipe="sidebarTeamProjectsRail" variant="ghost" padding="none">
      <Stack gap="xs">
        {projects.map((project) => {
          const isActive =
            location.pathname === `/${orgSlug}/projects/${project.key}` ||
            location.pathname.startsWith(`/${orgSlug}/projects/${project.key}/`);

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
          <Card recipe="sidebarTeamLoadMore" variant="ghost" padding="none">
            <Button variant="link" size="none" onClick={() => loadMore(10)}>
              <Typography variant="caption" color="brand">
                Load more...
              </Typography>
            </Button>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
