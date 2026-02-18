import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Lazy load PlateEditor (heavy Plate.js/ProseMirror dependency)
const PlateEditor = lazy(() =>
  import("@/components/PlateEditor").then((m) => ({ default: m.PlateEditor })),
);

export const Route = createFileRoute("/_auth/_app/$orgSlug/documents/$id")({
  component: DocumentPage,
});

function DocumentPage() {
  const { id } = Route.useParams();

  return (
    <div className="h-full overflow-auto bg-ui-bg">
      <ErrorBoundary>
        <Suspense
          key={id} // Force remount on document change to avoid stale error states
          fallback={
            <Flex align="center" justify="center" className="h-full bg-ui-bg">
              <LoadingSpinner size="lg" />
            </Flex>
          }
        >
          <PlateEditor documentId={id as Id<"documents">} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
