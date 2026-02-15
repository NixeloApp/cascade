import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PageContent, PageError, PageLayout } from "@/components/layout";
import { SprintManager } from "@/components/SprintManager";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/sprints")({
  component: SprintsPage,
});

function SprintsPage() {
  const { key } = Route.useParams();
  const project = useQuery(api.projects.getByKey, { key });

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
