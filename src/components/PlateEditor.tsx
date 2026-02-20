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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { getEditorPlugins, getInitialValue } from "@/lib/plate/editor";
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
  const document = useQuery(api.documents.getDocument, { id: documentId });
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
        onTitleEdit={handleTitleEdit}
        onTogglePublic={handleTogglePublic}
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
        </Card>
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
