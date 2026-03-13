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

import type { Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { PlateRichTextContent } from "@/components/ui/PlateRichTextContent";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Lock } from "@/lib/icons";
import {
  getEditorPlugins,
  getInitialValue,
  isEmptyValue,
  proseMirrorSnapshotToValue,
} from "@/lib/plate/editor";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { DocumentHeader, DocumentSidebar } from "./Documents";
import { ErrorBoundary } from "./ErrorBoundary";
import { MoveDocumentDialog } from "./MoveDocumentDialog";
import { FloatingToolbar } from "./Plate/FloatingToolbar";
import { SlashMenu } from "./Plate/SlashMenu";
import { VersionHistory } from "./VersionHistory";

interface PlateEditorProps {
  documentId: Id<"documents">;
}

interface EditorCanvasProps {
  initialEditorValue: Value;
  isEmptyEditor: boolean;
  isLocked: boolean;
  onChange: (value: Value) => void;
}

function EditorCanvas({
  initialEditorValue,
  isEmptyEditor,
  isLocked,
  onChange,
}: EditorCanvasProps) {
  const editor = usePlateEditor({
    plugins: getEditorPlugins(),
    value: initialEditorValue,
  });

  return (
    <Plate editor={editor} onChange={({ value }) => onChange(value)} readOnly={isLocked}>
      {!isLocked && <SlashMenu />}
      {!isLocked && <FloatingToolbar />}
      {isEmptyEditor && (
        <Card
          padding="lg"
          variant="soft"
          className="mb-4 border-ui-border-secondary/85 bg-linear-to-br from-ui-bg via-ui-bg-elevated/96 to-ui-bg-secondary/78"
        >
          <Grid cols={1} colsLg={5} gap="md">
            <Stack gap="sm" className="lg:col-span-3">
              <Stack gap="xs">
                <Typography variant="label">Blank document</Typography>
                <Typography variant="small" color="secondary">
                  Start with a short overview, key decisions, and next steps. Use `/` for blocks,
                  headings, and lists once you begin writing.
                </Typography>
              </Stack>

              <Flex wrap gap="sm">
                <Badge variant="secondary" shape="pill">
                  Overview
                </Badge>
                <Badge variant="secondary" shape="pill">
                  Decisions
                </Badge>
                <Badge variant="secondary" shape="pill">
                  Risks
                </Badge>
                <Badge variant="secondary" shape="pill">
                  Next steps
                </Badge>
              </Flex>

              <Grid cols={1} colsSm={2} gap="md">
                <Stack gap="xs">
                  <Typography variant="caption" className="uppercase tracking-widest">
                    Suggested outline
                  </Typography>
                  <Typography variant="small" color="secondary">
                    Summary, decisions, follow-ups, owners, and review date.
                  </Typography>
                </Stack>
                <Stack gap="xs">
                  <Typography variant="caption" className="uppercase tracking-widest">
                    Quick actions
                  </Typography>
                  <Typography variant="small" color="secondary">
                    Turn decisions into checklists, link risks to issues, and assign owners while
                    the discussion is still fresh.
                  </Typography>
                </Stack>
              </Grid>
            </Stack>

            <Card variant="outline" padding="md" className="h-full bg-ui-bg/88 lg:col-span-2">
              <Stack gap="sm">
                <Stack gap="xs">
                  <Typography variant="caption" className="uppercase tracking-widest">
                    Starter flow
                  </Typography>
                  <Typography variant="small" color="secondary">
                    Capture the summary first, then turn action items into tasks or linked issues.
                  </Typography>
                </Stack>
                <Stack gap="xs">
                  <Typography variant="caption" className="uppercase tracking-widest">
                    Suggested first section
                  </Typography>
                  <Typography variant="small" color="secondary">
                    Add a short context paragraph, then break out the decisions, open risks, and
                    next steps before expanding into full notes.
                  </Typography>
                </Stack>
              </Stack>
            </Card>
          </Grid>
        </Card>
      )}
      <PlateRichTextContent
        variant={isEmptyEditor ? "documentEditorEmpty" : "documentEditor"}
        data-testid={TEST_IDS.EDITOR.PLATE}
        placeholder="Start with a summary or press / for blocks"
        readOnly={isLocked}
      />
    </Plate>
  );
}

/**
 * Main editor component - renders the Plate editor with document sync
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Editor component with multiple document operations and state management
export function PlateEditor({ documentId }: PlateEditorProps) {
  const document = useAuthenticatedQuery(api.documents.getDocument, { id: documentId });
  const { mutate: updateTitle } = useAuthenticatedMutation(api.documents.updateTitle);
  const { mutate: togglePublic } = useAuthenticatedMutation(api.documents.togglePublic);
  const { mutate: toggleFavorite } = useAuthenticatedMutation(api.documents.toggleFavorite);
  const { mutate: archiveDocument } = useAuthenticatedMutation(api.documents.archiveDocument);
  const { mutate: unarchiveDocument } = useAuthenticatedMutation(api.documents.unarchiveDocument);
  const { mutate: lockDocument } = useAuthenticatedMutation(api.documents.lockDocument);
  const { mutate: unlockDocument } = useAuthenticatedMutation(api.documents.unlockDocument);
  const isFavorite = useAuthenticatedQuery(api.documents.isFavorite, { documentId });
  const isArchived = useAuthenticatedQuery(api.documents.isArchived, { documentId });
  const lockStatus = useAuthenticatedQuery(api.documents.getLockStatus, { documentId });
  const userId = useAuthenticatedQuery(api.presence.getUserId, {});
  const versionCount = useAuthenticatedQuery(api.documentVersions.getVersionCount, { documentId });
  const versions = useAuthenticatedQuery(api.documentVersions.listVersions, { documentId });

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editorValue, setEditorValue] = useState<Value>(getInitialValue());
  const initialEditorValue = versions?.[0]
    ? proseMirrorSnapshotToValue(versions[0].snapshot)
    : getInitialValue();
  // Derive empty state from initialEditorValue when versions are loaded to avoid flash
  const isEmptyEditor =
    versions !== undefined ? isEmptyValue(initialEditorValue) : isEmptyValue(editorValue);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(min-width: 1280px)").matches) {
      setShowSidebar(true);
    }
  }, []);

  useEffect(() => {
    if (versions === undefined) {
      return;
    }

    const latestVersion = versions[0];
    setEditorValue(
      latestVersion ? proseMirrorSnapshotToValue(latestVersion.snapshot) : getInitialValue(),
    );
  }, [versions]);

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
  const handleChange = (value: Value) => {
    // Track editor value for sidebar TOC
    setEditorValue(value);
    // TODO: Implement Y.js sync or direct Convex save
    console.debug("Editor content changed", value.length, "nodes");
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setShowSidebar((prev) => !prev);
  };

  // Handle version restore
  const handleRestoreVersion = async (snapshot: unknown, version: number, title: string) => {
    void version;
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

  // Loading state - while data is loading
  if (document === undefined || userId === undefined || versions === undefined) {
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

  // No user ID - shouldn't happen in authenticated routes but handle gracefully
  if (!userId) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Typography className="text-ui-text-secondary">Unable to load user data.</Typography>
      </Flex>
    );
  }

  // Document not found (or still loading after auth check - shouldn't happen but satisfies TypeScript)
  if (!document) {
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

      {/* Editor and Sidebar - Two column layout */}
      <Flex flex="1" className="overflow-hidden">
        {/* Editor - Clean Mintlify-inspired layout */}
        <FlexItem flex="1" className="overflow-auto bg-ui-bg scrollbar-subtle">
          <Card padding="md" variant="ghost" className="mx-auto w-full max-w-5xl">
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
              <EditorCanvas
                key={`${documentId}:${versions[0]?._id ?? "empty"}`}
                initialEditorValue={initialEditorValue}
                isEmptyEditor={isEmptyEditor}
                isLocked={lockStatus?.isLocked === true}
                onChange={handleChange}
              />
            </ErrorBoundary>
          </Card>
        </FlexItem>

        {/* Document Sidebar */}
        <DocumentSidebar
          editorValue={editorValue}
          documentInfo={{
            creatorName: document.creatorName,
            createdAt: document._creationTime,
            updatedAt: document.updatedAt,
            isPublic: document.isPublic,
            isArchived: isArchived ?? false,
          }}
          isOpen={showSidebar}
          onToggle={toggleSidebar}
        />
      </Flex>

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
