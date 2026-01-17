import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ProjectBoard } from "@/components/ProjectBoard";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/board")({
  component: BoardPage,
});

function BoardPage() {
  const { key } = Route.useParams();

  // Query project by key to get the ID
  const project = useQuery(api.projects.getByKey, { key });

  if (project === undefined) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <LoadingSpinner message="Loading project..." />
      </Flex>
    );
  }

  if (!project) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-semibold mb-2">
            Project Not Found
          </Typography>
          <Typography className="text-ui-text-secondary">
            The project "{key}" doesn't exist or you don't have access to it.
          </Typography>
        </div>
      </Flex>
    );
  }

  return <ProjectBoard projectId={project._id} />;
}
