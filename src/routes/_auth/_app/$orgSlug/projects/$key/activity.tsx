import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PageContent, PageError, PageHeader, PageLayout } from "@/components/Layout";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/activity")({
  component: ActivityPage,
});

function ActivityPage() {
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
    <PageLayout maxWidth="md">
      <PageHeader title="Project Activity" />
      <ActivityFeed projectId={project._id} />
    </PageLayout>
  );
}
