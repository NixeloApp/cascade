import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PageContent, PageError, PageLayout } from "@/components/Layout";
import { BillingReport } from "@/components/TimeTracker/BillingReport";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/billing")({
  component: BillingPage,
});

function BillingPage() {
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

  return (
    <PageLayout>
      <BillingReport projectId={project._id} />
    </PageLayout>
  );
}
