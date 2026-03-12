import { createFileRoute } from "@tanstack/react-router";
import { PageContent, PageError, PageLayout } from "@/components/layout";
import { SprintManager } from "@/components/Sprints";
import { useProjectByKey } from "@/hooks/useProjectByKey";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/sprints")({
  component: SprintsPage,
});

function SprintsPage() {
  const { key } = Route.useParams();
  const project = useProjectByKey(key);

  if (project === undefined) {
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

  const canEdit = project.userRole !== "viewer";

  return (
    <PageLayout>
      <SprintManager projectId={project._id} canEdit={canEdit} />
    </PageLayout>
  );
}
