import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DocumentTemplatesManager } from "@/components/DocumentTemplatesManager";
import { PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";

export const Route = createFileRoute("/_auth/_app/$orgSlug/documents/templates")({
  component: DocumentTemplatesPage,
});

function DocumentTemplatesPage() {
  const [createRequested, setCreateRequested] = useState(0);

  return (
    <PageLayout maxWidth="lg">
      <PageHeader
        title="Document Templates"
        description="Create documents from pre-built templates"
        actions={
          <Button
            onClick={() => setCreateRequested((c) => c + 1)}
            leftIcon={
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            }
          >
            New Template
          </Button>
        }
      />
      <DocumentTemplatesManager createRequested={createRequested} />
    </PageLayout>
  );
}
