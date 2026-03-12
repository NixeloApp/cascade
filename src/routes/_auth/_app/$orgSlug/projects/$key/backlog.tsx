import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/KanbanBoard";
import { PageContent, PageError } from "@/components/layout";
import { useProjectByKey } from "@/hooks/useProjectByKey";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/backlog")({
  component: BacklogPage,
});

function BacklogPage() {
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

  return <KanbanBoard projectId={project._id} />;
}
