import { createFileRoute } from "@tanstack/react-router";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/_auth/_app/$orgSlug/documents/")({
  component: DocumentsListPage,
});

function DocumentsListPage() {
  return (
    <Flex align="center" justify="center" className="flex-1 text-ui-text-tertiary p-4 h-full">
      <div className="text-center">
        <Typography variant="h2" className="text-xl font-medium mb-2">
          Welcome to your project
        </Typography>
        <Typography variant="p" color="tertiary">
          Select a document from the sidebar or create a new one to get started.
        </Typography>
      </div>
    </Flex>
  );
}
