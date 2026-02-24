import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Link, useLocation } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { NavItem } from "@/components/ui/NavItem";
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
    <li className="ml-4 list-none">
      {/* Team Header */}
      <Flex align="center" gap="xs">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle(team.slug)}
          className="h-6 w-6 p-0.5"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Collapse ${team.name}` : `Expand ${team.name}`}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
        <Tooltip content={team.name}>
          <NavItem asChild active={isActive} size="sm" className="flex-1">
            <Link
              to={ROUTES.workspaces.teams.detail.path}
              params={{ orgSlug, workspaceSlug, teamSlug: team.slug }}
              onClick={onNavClick}
            >
              {team.name}
            </Link>
          </NavItem>
        </Tooltip>
      </Flex>

      {/* Lazy Loaded Projects */}
      {isExpanded && (
        <SidebarTeamProjects teamId={team._id} orgSlug={orgSlug} onNavClick={onNavClick} />
      )}
    </li>
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
      <Typography variant="caption" color="tertiary" className="ml-6 px-3 py-1">
        Loading...
      </Typography>
    );
  }

  if (projects.length === 0) {
    return (
      <Typography variant="caption" color="tertiary" className="ml-6 px-3 py-1">
        No projects
      </Typography>
    );
  }

  return (
    <ul className="ml-6 border-l border-ui-border pl-1 list-none">
      {projects.map((project) => {
        const isActive =
          location.pathname === `/${orgSlug}/projects/${project.key}` ||
          location.pathname.startsWith(`/${orgSlug}/projects/${project.key}/`);

        return (
          <li key={project._id} className="list-none">
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
          </li>
        );
      })}

      {status === "CanLoadMore" && (
        <li className="list-none">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadMore(10)}
            className="ml-2 text-xs h-6 px-2 text-brand"
          >
            Load more...
          </Button>
        </li>
      )}
    </ul>
  );
}
