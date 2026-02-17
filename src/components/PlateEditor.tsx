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
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { Typography } from "@/components/ui/Typography";
import { getEditorPlugins, getInitialValue } from "@/lib/plate/editor";
import { handleMarkdownExport, handleMarkdownImport } from "@/lib/plate/markdown";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { DocumentHeader } from "./DocumentHeader";
import { ErrorBoundary } from "./ErrorBoundary";
import { FloatingToolbar } from "./Plate/FloatingToolbar";
import { SlashMenu } from "./Plate/SlashMenu";
import { VersionHistory } from "./VersionHistory";

interface PlateEditorProps {
  documentId: Id<"documents">;
}

/**
 * Main editor component - renders the Plate editor with document sync
 */
export function PlateEditor({ documentId }: PlateEditorProps) {
  const document = useQuery(api.documents.get, { id: documentId });
  const updateTitle = useMutation(api.documents.updateTitle);
  const togglePublic = useMutation(api.documents.togglePublic);
  const userId = useQuery(api.presence.getUserId);
  const versionCount = useQuery(api.documentVersions.getVersionCount, { documentId });

  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Create editor with plugins
  const editor = usePlateEditor({
    plugins: getEditorPlugins(),
    value: getInitialValue(),
  });

  // Handle title edit
  const handleTitleEdit = useCallback(
    async (title: string) => {
      try {
        await updateTitle({ id: documentId, title });
        showSuccess("Title updated");
      } catch (error) {
        showError(error, "Failed to update title");
      }
    },
    [documentId, updateTitle],
  );

  // Handle toggle public
  const handleTogglePublic = useCallback(async () => {
    if (!document) return;
    try {
      await togglePublic({ id: documentId });
      showSuccess(document.isPublic ? "Document is now private" : "Document is now public");
    } catch (error) {
      showError(error, "Failed to update document visibility");
    }
  }, [document, documentId, togglePublic]);

  // Handle content change (debounced save would go here)
  const handleChange = useCallback(({ value: _value }: { value: Value }) => {
    // TODO: Implement Y.js sync or direct Convex save
    // Content change tracking placeholder - sync implementation pending
  }, []);

  // Handle version restore
  const handleRestoreVersion = useCallback(
    async (snapshot: unknown, _version: number, title: string) => {
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
    },
    [document, documentId, updateTitle],
  );

  // Loading state
  if (document === undefined || userId === undefined) {
    return (
      <Flex direction="column" className="h-full bg-ui-bg">
        <div className="border-b border-ui-border bg-ui-bg p-4 sm:p-6">
          <Flex align="center" justify="between" className="mb-4">
            <Skeleton className="h-8 w-1/2" />
            <Flex align="center" className="space-x-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </Flex>
          </Flex>
          <Flex align="center" className="space-x-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </Flex>
        </div>
        <FlexItem flex="1" className="overflow-auto bg-ui-bg">
          <div className="max-w-3xl mx-auto px-4 py-8 sm:px-8 sm:py-12">
            <SkeletonText lines={8} />
          </div>
        </FlexItem>
      </Flex>
    );
  }

  // Document not found
  if (document === null) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-semibold mb-2">
            Document Not Found
          </Typography>
          <Typography className="text-ui-text-secondary mb-4">
            This document doesn't exist or you don't have access to it.
          </Typography>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
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
        onTitleEdit={handleTitleEdit}
        onTogglePublic={handleTogglePublic}
        onImportMarkdown={async () => {
          const value = await handleMarkdownImport();
          if (value) {
            // Reset editor with imported content
            editor.tf.reset();
            editor.tf.setValue(value);
          }
        }}
        onExportMarkdown={async () => {
          const value = editor.children;
          handleMarkdownExport(value, document.title || "document");
        }}
        onShowVersionHistory={() => setShowVersionHistory(true)}
        editorReady={true}
      />

      {/* Editor - Clean Mintlify-inspired layout */}
      <FlexItem flex="1" className="overflow-auto bg-ui-bg scrollbar-subtle">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:px-8 sm:py-12">
          <ErrorBoundary
            fallback={
              <div className="p-6 border border-status-error/20 bg-status-error-bg rounded-container text-status-error text-center">
                <Typography variant="p" className="font-medium tracking-tight">
                  Editor failed to load
                </Typography>
                <Typography variant="muted" className="mt-2 opacity-80">
                  There was an issue initializing the rich text editor.
                </Typography>
              </div>
            }
          >
            <Plate editor={editor} onChange={handleChange}>
              <SlashMenu />
              <FloatingToolbar />
              <PlateContent
                className="min-h-96 prose prose-sm max-w-none focus:outline-none text-ui-text leading-relaxed"
                data-testid={TEST_IDS.EDITOR.PLATE}
                placeholder="Start writing..."
              />
            </Plate>
          </ErrorBoundary>
        </div>
      </FlexItem>

      {/* Version History Modal */}
      <VersionHistory
        documentId={documentId}
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        onRestoreVersion={handleRestoreVersion}
      />
    </Flex>
  );
}
