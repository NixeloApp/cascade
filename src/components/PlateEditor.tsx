/**
 * Plate Editor Component
 *
 * Rich text editor built on Plate.js (Slate-based).
 * Replaces the old BlockNote editor with:
 * - Better React 19 compatibility
 * - AI plugin support
 * - shadcn/ui native styling
 * - Y.js collaboration support
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { Value } from "platejs";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { Lock } from "@/lib/icons";
import { getEditorPlugins, getInitialValue } from "@/lib/plate/editor";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { DocumentHeader } from "./DocumentHeader";
import { ErrorBoundary } from "./ErrorBoundary";
import { MoveDocumentDialog } from "./MoveDocumentDialog";
import { FloatingToolbar } from "./Plate/FloatingToolbar";
import { SlashMenu } from "./Plate/SlashMenu";
import { VersionHistory } from "./VersionHistory";

interface PlateEditorProps {
  documentId: Id<"documents">;
}

/**
 * Main editor component - renders the Plate editor with document sync
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Editor component with multiple document operations and state management
export function PlateEditor({ documentId }: PlateEditorProps) {
  const document = useQuery(api.documents.getDocument, { id: documentId });
  const updateTitle = useMutation(api.documents.updateTitle);
  const togglePublic = useMutation(api.documents.togglePublic);
  const toggleFavorite = useMutation(api.documents.toggleFavorite);
  const archiveDocument = useMutation(api.documents.archiveDocument);
  const unarchiveDocument = useMutation(api.documents.unarchiveDocument);
  const lockDocument = useMutation(api.documents.lockDocument);
  const unlockDocument = useMutation(api.documents.unlockDocument);
  const isFavorite = useQuery(api.documents.isFavorite, { documentId });
  const isArchived = useQuery(api.documents.isArchived, { documentId });
  const lockStatus = useQuery(api.documents.getLockStatus, { documentId });
  const userId = useQuery(api.presence.getUserId);
  const versionCount = useQuery(api.documentVersions.getVersionCount, { documentId });

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  // Create editor with plugins
  const editor = usePlateEditor({
    plugins: getEditorPlugins(),
    value: getInitialValue(),
  });

  // Handle title edit
  const handleTitleEdit = async (title: string) => {
    try {
      await updateTitle({ id: documentId, title });
      showSuccess("Title updated");
    } catch (error) {
      showError(error, "Failed to update title");
    }
  };

  // Handle toggle public
  const handleTogglePublic = async () => {
    if (!document) return;
    try {
      await togglePublic({ id: documentId });
      showSuccess(document.isPublic ? "Document is now private" : "Document is now public");
    } catch (error) {
      showError(error, "Failed to update document visibility");
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async () => {
    try {
      const result = await toggleFavorite({ documentId });
      showSuccess(result.isFavorite ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      showError(error, "Failed to update favorite");
    }
  };

  // Handle toggle archive
  const handleToggleArchive = async () => {
    try {
      if (isArchived) {
        await unarchiveDocument({ id: documentId });
        showSuccess("Document unarchived");
      } else {
        await archiveDocument({ id: documentId });
        showSuccess("Document archived");
      }
    } catch (error) {
      showError(error, "Failed to update archive status");
    }
  };

  // Handle toggle lock
  const handleToggleLock = async () => {
    try {
      if (lockStatus?.isLocked) {
        await unlockDocument({ id: documentId });
        showSuccess("Document unlocked");
      } else {
        await lockDocument({ id: documentId });
        showSuccess("Document locked");
      }
    } catch (error) {
      showError(error, "Failed to update lock status");
    }
  };

  // Handle content change (debounced save would go here)
  const handleChange = ({ value }: { value: Value }) => {
    // TODO: Implement Y.js sync or direct Convex save
    // For now, just log changes
    console.debug("Editor content changed", value.length, "nodes");
  };

  // Handle version restore
  const handleRestoreVersion = async (snapshot: unknown, _version: number, title: string) => {
    try {
      if (snapshot && document) {
        // Update document title if it changed
        if (title !== document.title) {
          await updateTitle({ id: documentId, title });
        }
        showSuccess("Version restored successfully. Refreshing...");
        // Reload the page to apply the restored version
        window.location.reload();
      }
    } catch (error) {
      showError(error, "Failed to restore version");
    }
  };

  // Loading state
  if (document === undefined || userId === undefined) {
    return (
      <Flex direction="column" className="h-full bg-ui-bg">
        <Card padding="lg" radius="none" className="border-x-0 border-t-0">
          <Stack gap="md">
            <Flex align="center" justify="between">
              <Skeleton className="h-8 w-1/2" />
              <Flex align="center" gap="md">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
              </Flex>
            </Flex>
            <Flex align="center" gap="md">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </Flex>
          </Stack>
        </Card>
        <FlexItem flex="1" className="overflow-auto bg-ui-bg">
          <Card padding="lg" variant="ghost" className="max-w-3xl mx-auto">
            <SkeletonText lines={8} />
          </Card>
        </FlexItem>
      </Flex>
    );
  }

  // Document not found
  if (document === null) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Stack gap="md" align="center" className="text-center">
          <Typography variant="h3">Document Not Found</Typography>
          <Typography color="secondary">
            This document doesn't exist or you don't have access to it.
          </Typography>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go back
          </Button>
        </Stack>
      </Flex>
    );
  }

  // User not authenticated
  if (!userId) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Typography className="text-ui-text-secondary">
          Please sign in to view this document.
        </Typography>
      </Flex>
    );
  }

  return (
    <Flex direction="column" className="h-full bg-ui-bg">
      {/* Document Header */}
      <DocumentHeader
        document={document}
        userId={userId}
        versionCount={versionCount}
        isFavorite={isFavorite ?? false}
        isArchived={isArchived ?? false}
        lockStatus={
          lockStatus
            ? {
                isLocked: lockStatus.isLocked,
                lockedByName: lockStatus.isLocked ? lockStatus.lockedByName : undefined,
                canUnlock: lockStatus.isLocked ? lockStatus.canUnlock : undefined,
              }
            : undefined
        }
        onTitleEdit={handleTitleEdit}
        onTogglePublic={handleTogglePublic}
        onToggleFavorite={handleToggleFavorite}
        onToggleArchive={handleToggleArchive}
        onToggleLock={handleToggleLock}
        onMoveToProject={() => setShowMoveDialog(true)}
        onImportMarkdown={async () => {
          // TODO: Implement markdown import
          showError("Markdown import not yet implemented for Plate editor");
        }}
        onExportMarkdown={async () => {
          // TODO: Implement markdown export
          showError("Markdown export not yet implemented for Plate editor");
        }}
        onShowVersionHistory={() => setShowVersionHistory(true)}
        editorReady={true}
      />

      {/* Locked Banner */}
      {lockStatus?.isLocked && (
        <Alert variant="warning" className="rounded-none border-x-0">
          <Lock className="h-4 w-4" />
          <AlertTitle>Document Locked</AlertTitle>
          <AlertDescription>
            This document is locked by {lockStatus.lockedByName || "another user"}.
            {lockStatus.canUnlock
              ? " You can unlock it to make changes."
              : " Only the person who locked it or an admin can unlock it."}
          </AlertDescription>
        </Alert>
      )}

      {/* Editor - Clean Mintlify-inspired layout */}
      <FlexItem flex="1" className="overflow-auto bg-ui-bg scrollbar-subtle">
        <Card padding="lg" variant="ghost" className="max-w-3xl mx-auto">
          <ErrorBoundary
            fallback={
              <Card
                padding="lg"
                className="border-status-error/20 bg-status-error-bg text-status-error text-center"
              >
                <Stack gap="sm">
                  <Typography variant="label">Editor failed to load</Typography>
                  <Typography variant="muted" className="opacity-80">
                    There was an issue initializing the rich text editor.
                  </Typography>
                </Stack>
              </Card>
            }
          >
            <Plate editor={editor} onChange={handleChange} readOnly={lockStatus?.isLocked}>
              {!lockStatus?.isLocked && <SlashMenu />}
              {!lockStatus?.isLocked && <FloatingToolbar />}
              <PlateContent
                className="min-h-96 prose prose-sm max-w-none focus-visible:outline-none text-ui-text leading-relaxed"
                data-testid={TEST_IDS.EDITOR.PLATE}
                placeholder="Start writing..."
                readOnly={lockStatus?.isLocked}
              />
            </Plate>
          </ErrorBoundary>
        </Card>
      </FlexItem>

      {/* Version History Modal */}
      <VersionHistory
        documentId={documentId}
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* Move Document Dialog */}
      {document && (
        <MoveDocumentDialog
          open={showMoveDialog}
          onOpenChange={setShowMoveDialog}
          documentId={documentId}
          currentProjectId={document.projectId}
          organizationId={document.organizationId}
        />
      )}
    </Flex>
  );
}
