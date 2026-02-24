import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { Folder } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { SkeletonProjectCard } from "../ui/Skeleton";

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
    <Card hoverable>
      <CardHeader title="Workspaces" description={`${count} active ${workspacesLabel}`} />
      <CardBody>
        {!projects ? (
          /* Loading skeleton */
          <Flex direction="column" gap="sm">
            <SkeletonProjectCard />
            <SkeletonProjectCard />
            <SkeletonProjectCard />
          </Flex>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No projects"
            description="You're not a member of any projects yet"
            action={{
              label: "Go to Workspaces",
              onClick: navigateToWorkspaces,
            }}
          />
        ) : (
          <Flex direction="column" gap="xs" ref={projectNavigation.listRef}>
            {projects.map((project, index) => (
              <Button
                key={project._id}
                variant="unstyled"
                onClick={() => navigateToWorkspace(project.key)}
                {...projectNavigation.getItemProps(index)}
                className={cn(
                  "w-full text-left p-3 rounded-lg group cursor-pointer h-auto",
                  "bg-ui-bg-soft border border-transparent",
                  "hover:border-ui-border-secondary hover:bg-ui-bg-hover",
                  "transition-all duration-200",
                  projectNavigation.getItemProps(index).className,
                )}
              >
                <Flex align="center" gap="sm">
                  {/* Project avatar/icon */}
                  <Avatar
                    name={project.name}
                    size="md"
                    variant="brand"
                    className="ring-1 ring-brand/20 group-hover:ring-brand/40 transition-all"
                  />
                  <FlexItem flex="1" className="min-w-0">
                    <Flex justify="between" align="center" gap="sm">
                      <Typography
                        variant="label"
                        className="truncate group-hover:text-brand transition-colors tracking-tight"
                      >
                        {project.name}
                      </Typography>
                      <Badge variant="neutral" size="sm" className="uppercase">
                        {project.role}
                      </Badge>
                    </Flex>
                    <Typography variant="small" color="secondary">
                      {project.myIssues} assigned issues
                    </Typography>
                  </FlexItem>
                </Flex>
              </Button>
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
