import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { PageContent, PageError, PageLayout } from "@/components/layout";
import { ROUTES } from "@/config/routes";

const ProjectSettings = lazy(() =>
  import("@/components/ProjectSettings").then((m) => ({ default: m.ProjectSettings })),
);

import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProjectByKey } from "@/hooks/useProjectByKey";
export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { key, orgSlug } = Route.useParams();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const project = useProjectByKey(key);
  const userRole = useAuthenticatedQuery(
    api.projects.getProjectUserRole,
    project ? { projectId: project._id } : "skip",
  );

  if (project === undefined || userRole === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  if (!project) {
    return (
      <PageError
        title="Project Not Found"
        message={`The project "${key}" doesn't exist or you don't have access to it.`}
      />
    );
  }

  // Check if user is admin (via role OR ownership)
  const isAdmin = userRole === "admin" || project.ownerId === user?._id;

  // Redirect non-admins to board
  if (!isAdmin) {
    navigate({
      to: ROUTES.projects.board.path,
      params: { orgSlug, key },
    });
    return null;
  }

  // Defensive: Ensure arrays exist (should always be the case, but prevents crashes)
  const safeMembers = project.members ?? [];
  const safeWorkflowStates = project.workflowStates ?? [];

  return (
    <PageLayout>
      <Suspense fallback={<PageContent isLoading>{null}</PageContent>}>
        <ProjectSettings
          projectId={project._id}
          name={project.name}
          projectKey={project.key}
          description={project.description}
          workflowStates={safeWorkflowStates}
          members={safeMembers}
          createdBy={project.createdBy}
          ownerId={project.ownerId}
          isOwner={project.ownerId === user?._id || project.createdBy === user?._id}
          orgSlug={orgSlug}
        />
      </Suspense>
    </PageLayout>
  );
}
