import { createFileRoute } from "@tanstack/react-router";
import { PageContent, PageError, PageLayout } from "@/components/layout";
import { BillingReport } from "@/components/TimeTracker/BillingReport";
import { useProjectByKey } from "@/hooks/useProjectByKey";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/billing")({
  component: BillingPage,
});

function BillingPage() {
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

  return (
    <PageLayout>
      <BillingReport projectId={project._id} />
    </PageLayout>
  );
}
