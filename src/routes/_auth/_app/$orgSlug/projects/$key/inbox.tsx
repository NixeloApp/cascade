import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { InboxList } from "@/components/InboxList";
import { PageContent, PageError } from "@/components/layout";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/inbox")({
  component: InboxPage,
});

function InboxPage() {
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

  return <InboxList projectId={project._id} />;
}
