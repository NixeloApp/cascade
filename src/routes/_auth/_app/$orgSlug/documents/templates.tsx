import { createFileRoute } from "@tanstack/react-router";
import { DocumentTemplatesManager } from "@/components/DocumentTemplatesManager";

export const Route = createFileRoute("/_auth/_app/$orgSlug/documents/templates")({
  component: DocumentTemplatesPage,
});

function DocumentTemplatesPage() {
  return (
    <div className="flex-1 p-6 h-full overflow-y-auto bg-ui-bg-secondary">
      <div className="max-w-6xl mx-auto">
        <DocumentTemplatesManager />
      </div>
    </div>
  );
}
