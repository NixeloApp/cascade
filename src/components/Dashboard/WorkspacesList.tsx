/**
 * Workspaces List
 *
 * Dashboard widget showing user's project workspaces.
 * Displays project cards with issue counts and role badges.
 * Supports keyboard navigation and loading states.
 */

import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { Folder } from "@/lib/icons";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { SkeletonProjectCard } from "../ui/Skeleton";
import { DashboardPanel, DashboardPanelBody, DashboardPanelHeader } from "./DashboardPanel";

interface Project {
  _id: Id<"projects">;
  key: string;
  name: string;
  role: string;
  myIssues: number;
  totalIssues: number;
}

interface WorkspacesListProps {
  projects: Project[] | undefined;
  projectNavigation: {
    listRef: React.RefObject<HTMLDivElement | null>;
    getItemProps: (index: number) => {
      className: string;
      [key: string]: unknown;
    };
  };
}

/**
 * Workspaces list for dashboard sidebar
 * Extracted from Dashboard component to reduce complexity
 */
export function WorkspacesList({ projects, projectNavigation }: WorkspacesListProps) {
  const navigate = useNavigate();
  const { orgSlug } = useOrganization();

  const navigateToWorkspace = (projectKey: string) => {
    navigate({
      to: ROUTES.projects.board.path,
      params: { orgSlug, key: projectKey },
    });
  };

  const navigateToWorkspaces = () => {
    navigate({ to: ROUTES.workspaces.list.path, params: { orgSlug } });
  };
  const count = projects?.length || 0;
  const workspacesLabel = count === 1 ? "project" : "projects";

  return (
    <DashboardPanel surface="inset">
      <DashboardPanelHeader title="Workspaces" description={`${count} active ${workspacesLabel}`} />
      <DashboardPanelBody>
        {!projects ? (
          <Flex direction="column" gap="sm">
            <SkeletonProjectCard />
            <SkeletonProjectCard />
            <SkeletonProjectCard />
          </Flex>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No projects"
            description="Projects you belong to will show their board, docs, and tracked work here."
            size="compact"
            surface="bare"
            action={{
              label: "Go to Workspaces",
              onClick: navigateToWorkspaces,
            }}
          />
        ) : (
          <Flex direction="column" gap="xs" ref={projectNavigation.listRef}>
            {projects.map((project, index) => {
              const itemProps = projectNavigation.getItemProps(index);

              return (
                <Button
                  key={project._id}
                  variant="unstyled"
                  chrome="listRow"
                  chromeSize="listRow"
                  onClick={() => navigateToWorkspace(project.key)}
                  {...itemProps}
                  className={itemProps.className}
                >
                  <Flex align="center" gap="sm">
                    {/* Project avatar/icon */}
                    <Avatar name={project.name} size="md" variant="brand" hoverRing />
                    <FlexItem flex="1" className="min-w-0">
                      <Flex justify="between" align="center" gap="sm">
                        <Typography variant="listTitle" className="truncate">
                          {project.name}
                        </Typography>
                        <Badge variant="dashboardTag" size="sm">
                          {project.role}
                        </Badge>
                      </Flex>
                      <Typography variant="small" color="secondary" className="mt-1">
                        {project.myIssues} assigned issues · {project.totalIssues} total tracked
                      </Typography>
                    </FlexItem>
                  </Flex>
                </Button>
              );
            })}
          </Flex>
        )}
      </DashboardPanelBody>
    </DashboardPanel>
  );
}
