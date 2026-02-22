import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PageContent, PageError, PageLayout } from "@/components/layout";
import { ModuleManager } from "@/components/ModuleManager";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/modules")({
  component: ModulesPage,
});

function ModulesPage() {
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
      <ModuleManager projectId={project._id} canEdit={canEdit} />
    </PageLayout>
  );
}
