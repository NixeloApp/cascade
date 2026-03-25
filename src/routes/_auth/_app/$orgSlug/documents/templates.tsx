import type { Doc } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DocumentTemplatesManager } from "@/components/Documents";
import { PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { useSeededDocumentCreation } from "@/hooks/useSeededDocumentCreation";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_auth/_app/$orgSlug/documents/templates")({
  component: DocumentTemplatesPage,
});

/** Document template picker that creates and opens a seeded document on selection. */
export function DocumentTemplatesPage() {
  const [createRequested, setCreateRequested] = useState(0);
  const { createTemplateDocumentAndOpen } = useSeededDocumentCreation();

  const handleSelectTemplate = async (template: Doc<"documentTemplates">) => {
    try {
      const created = await createTemplateDocumentAndOpen({
        templateId: template._id,
        title: template.name,
        projectId: template.projectId,
        isPublic: false,
      });

      if (created) {
        showSuccess("Document created from template");
      }
    } catch (error) {
      showError(error, "Failed to create document from template");
    }
  };

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
                className="size-4"
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
      <DocumentTemplatesManager
        createRequested={createRequested}
        onSelectTemplate={handleSelectTemplate}
      />
    </PageLayout>
  );
}
