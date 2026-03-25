import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import type { Value } from "platejs";
import { useRef, useState } from "react";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import {
  blockNoteContentToPlateValue,
  serializePlateSeedValue,
} from "@/lib/documents/seededDocuments";

type SeededDocumentArgs = {
  isPublic: boolean;
  projectId?: Id<"projects">;
  title: string;
  value: Value;
};

type TemplateDocumentArgs = {
  isPublic: boolean;
  projectId?: Id<"projects">;
  templateId: Id<"documentTemplates">;
  title: string;
};

async function attemptCleanup(
  documentId: Id<"documents">,
  deleteDocument: (args: { id: Id<"documents"> }) => Promise<unknown>,
) {
  try {
    await deleteDocument({ id: documentId });
  } catch {
    // Keep the original seed failure as the surfaced error.
  }
}

/**
 * Creates fully seeded documents, applies the initial ProseMirror snapshot,
 * navigates to the new document, and cleans up partially created documents
 * if snapshot seeding fails.
 */
export function useSeededDocumentCreation() {
  const navigate = useNavigate();
  const { organizationId, orgSlug } = useOrganization();
  const { mutate: createDocument } = useAuthenticatedMutation(api.documents.create);
  const { mutate: deleteDocument } = useAuthenticatedMutation(api.documents.deleteDocument);
  const { mutate: createDocumentFromTemplate } = useAuthenticatedMutation(
    api.documentTemplates.createDocumentFromTemplate,
  );
  const { mutate: submitSnapshot } = useAuthenticatedMutation(api.prosemirror.submitSnapshot);
  const inFlightRef = useRef(false);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const seedSnapshot = async (documentId: Id<"documents">, value: Value) => {
    await submitSnapshot({
      id: documentId,
      version: 1,
      content: serializePlateSeedValue(value),
    });
  };

  const openDocument = (documentId: Id<"documents">) => {
    navigate({
      to: ROUTES.documents.detail.path,
      params: { orgSlug, id: documentId },
    });
  };

  const runSingleCreate = async <T>(callback: () => Promise<T>) => {
    if (inFlightRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setIsCreatingDocument(true);
    setError(null);

    try {
      return await callback();
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Document creation failed"));
      throw error;
    } finally {
      inFlightRef.current = false;
      setIsCreatingDocument(false);
    }
  };

  const createSeededDocumentAndOpen = async (args: SeededDocumentArgs) =>
    runSingleCreate(async () => {
      const { documentId } = await createDocument({
        title: args.title,
        isPublic: args.isPublic,
        organizationId,
        projectId: args.projectId,
      });

      try {
        await seedSnapshot(documentId, args.value);
      } catch (error) {
        await attemptCleanup(documentId, deleteDocument);
        throw error;
      }

      openDocument(documentId);
      return { documentId };
    });

  const createTemplateDocumentAndOpen = async (args: TemplateDocumentArgs) =>
    runSingleCreate(async () => {
      const result = await createDocumentFromTemplate({
        templateId: args.templateId,
        title: args.title,
        organizationId,
        projectId: args.projectId,
        isPublic: args.isPublic,
      });

      try {
        await seedSnapshot(result.documentId, blockNoteContentToPlateValue(result.templateContent));
      } catch (error) {
        await attemptCleanup(result.documentId, deleteDocument);
        throw error;
      }

      openDocument(result.documentId);
      return { documentId: result.documentId };
    });

  return {
    createSeededDocumentAndOpen,
    createTemplateDocumentAndOpen,
    error,
    isCreatingDocument,
    isLoading: isCreatingDocument,
  };
}
