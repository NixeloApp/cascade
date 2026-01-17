import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { DocumentEditor } from "@/components/DocumentEditor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export const Route = createFileRoute("/_auth/_app/$orgSlug/documents/$id")({
  component: DocumentPage,
});

function DocumentPage() {
  const { id } = Route.useParams();

  return (
    <div className="h-full overflow-auto">
      <ErrorBoundary>
        <Suspense
          key={id} // Force remount on document change to avoid stale error states
          fallback={
            <Flex align="center" justify="center" className="h-full">
              <LoadingSpinner size="lg" />
            </Flex>
          }
        >
          <DocumentEditor documentId={id as Id<"documents">} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
