import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ProjectSettings } from "@/components/ProjectSettings";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/settings",
)({
  component: SettingsPage,
});

function SettingsPage() {
  const { key, orgSlug } = Route.useParams();
  const { user } = useCurrentUser();
  const project = useQuery(api.projects.getByKey, { key });
  const userRole = useQuery(
    api.projects.getProjectUserRole,
    project ? { projectId: project._id } : "skip",
  );

  if (project === undefined || userRole === undefined) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <LoadingSpinner message="Loading settings..." />
      </Flex>
    );
  }

  if (!project) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Typography variant="p" color="secondary">
          Project not found
        </Typography>
      </Flex>
    );
  }

  // Check if user is admin
  const isAdmin = userRole === "admin" || project.createdBy === user?._id;

  if (!isAdmin) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <div className="text-center">
          <Typography variant="h3" className="mb-2">
            Access Denied
          </Typography>
          <Typography variant="p" color="secondary">
            You need admin permissions to access project settings.
          </Typography>
        </div>
      </Flex>
    );
  }

  const { members, workflowStates } = project;

  return (
    <ProjectSettings
      projectId={project._id}
      name={project.name}
      projectKey={project.key}
      description={project.description}
      workflowStates={workflowStates}
      members={members}
      createdBy={project.createdBy}
      ownerId={project.ownerId}
      isOwner={project.ownerId === user?._id || project.createdBy === user?._id}
      orgSlug={orgSlug}
    />
  );
}
