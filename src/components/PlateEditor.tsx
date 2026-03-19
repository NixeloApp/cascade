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
import { markdownToValue, readMarkdownForPreview } from "@/lib/plate/markdown";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { DocumentHeader, DocumentSidebar } from "./Documents";
import { ErrorBoundary } from "./ErrorBoundary";
import { MoveDocumentDialog } from "./MoveDocumentDialog";
import { FloatingToolbar } from "./Plate/FloatingToolbar";
import { SlashMenu } from "./Plate/SlashMenu";
import { MarkdownPreviewModal } from "./ui/MarkdownPreviewModal";
import { VersionHistory } from "./VersionHistory";

interface PlateEditorProps {
  documentId: Id<"documents">;
}

type PlateEditorDocument = NonNullable<
  ReturnType<typeof useAuthenticatedQuery<typeof api.documents.getDocument>>
>;
type PlateEditorLockStatus = NonNullable<
  ReturnType<typeof useAuthenticatedQuery<typeof api.documents.getLockStatus>>
>;
type PlateEditorVersions = NonNullable<
  ReturnType<typeof useAuthenticatedQuery<typeof api.documentVersions.listVersions>>
>;

interface EditorCanvasProps {
  initialEditorValue: Value;
  isEmptyEditor: boolean;
  isLocked: boolean;
  onChange: (value: Value) => void;
}

interface PlateEditorLoadingStateProps {
  versionsLoaded: boolean;
}

interface PlateEditorEmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: React.ComponentProps<typeof Button>["variant"];
  };
}

interface PlateEditorActionsArgs {
  documentId: Id<"documents">;
  document: PlateEditorDocument | null | undefined;
  isArchived: boolean;
  lockStatus: PlateEditorLockStatus | undefined;
  updateTitle: (args: { id: Id<"documents">; title: string }) => Promise<unknown>;
  togglePublic: (args: { id: Id<"documents"> }) => Promise<unknown>;
  toggleFavorite: (args: { documentId: Id<"documents"> }) => Promise<{ isFavorite: boolean }>;
  archiveDocument: (args: { id: Id<"documents"> }) => Promise<unknown>;
  unarchiveDocument: (args: { id: Id<"documents"> }) => Promise<unknown>;
  lockDocument: (args: { id: Id<"documents"> }) => Promise<unknown>;
  unlockDocument: (args: { id: Id<"documents"> }) => Promise<unknown>;
}

interface UsePlateEditorUiStateArgs {
  documentId: Id<"documents">;
  document: PlateEditorDocument | null | undefined;
  versions: PlateEditorVersions | undefined;
  updateTitle: (args: { id: Id<"documents">; title: string }) => Promise<unknown>;
}

interface PlateEditorData {
  document: ReturnType<typeof useAuthenticatedQuery<typeof api.documents.getDocument>>;
  updateTitle: ReturnType<
    typeof useAuthenticatedMutation<typeof api.documents.updateTitle>
  >["mutate"];
  togglePublic: ReturnType<
    typeof useAuthenticatedMutation<typeof api.documents.togglePublic>
  >["mutate"];
  toggleFavorite: ReturnType<
    typeof useAuthenticatedMutation<typeof api.documents.toggleFavorite>
  >["mutate"];
  archiveDocument: ReturnType<
    typeof useAuthenticatedMutation<typeof api.documents.archiveDocument>
  >["mutate"];
  unarchiveDocument: ReturnType<
    typeof useAuthenticatedMutation<typeof api.documents.unarchiveDocument>
  >["mutate"];
  lockDocument: ReturnType<
    typeof useAuthenticatedMutation<typeof api.documents.lockDocument>
  >["mutate"];
  unlockDocument: ReturnType<
    typeof useAuthenticatedMutation<typeof api.documents.unlockDocument>
  >["mutate"];
  isFavorite: ReturnType<typeof useAuthenticatedQuery<typeof api.documents.isFavorite>>;
  isArchived: ReturnType<typeof useAuthenticatedQuery<typeof api.documents.isArchived>>;
  lockStatus: ReturnType<typeof useAuthenticatedQuery<typeof api.documents.getLockStatus>>;
  userId: ReturnType<typeof useAuthenticatedQuery<typeof api.presence.getUserId>>;
  versionCount: ReturnType<
    typeof useAuthenticatedQuery<typeof api.documentVersions.getVersionCount>
  >;
  versions: ReturnType<typeof useAuthenticatedQuery<typeof api.documentVersions.listVersions>>;
}

interface LoadedPlateEditorProps {
  documentId: Id<"documents">;
  data: PlateEditorData & {
    document: PlateEditorDocument;
    userId: NonNullable<PlateEditorData["userId"]>;
    versions: PlateEditorVersions;
  };
}

interface MarkdownImportPreview {
  markdown: string;
  filename: string;
}

function PlateEditorLoadingState({ versionsLoaded }: PlateEditorLoadingStateProps) {
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
        <Card padding="lg" variant="ghost" className="mx-auto w-full max-w-3xl">
          {versionsLoaded ? <SkeletonText lines={8} /> : <SkeletonText lines={8} />}
        </Card>
      </FlexItem>
    </Flex>
  );
}

function PlateEditorEmptyState({ title, description, action }: PlateEditorEmptyStateProps) {
  return (
    <Flex align="center" justify="center" className="h-full">
      <Stack gap="md" align="center" className="text-center">
        <Typography variant="h3">{title}</Typography>
        <Typography color="secondary">{description}</Typography>
        {action && (
          <Button variant={action.variant ?? "outline"} onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </Stack>
    </Flex>
  );
}

function LockedDocumentBanner({
  lockStatus,
}: {
  lockStatus: NonNullable<
    ReturnType<typeof useAuthenticatedQuery<typeof api.documents.getLockStatus>>
  >;
}) {
  return (
    <Alert variant="warning" radius="none" className="border-x-0">
      <Lock className="h-4 w-4" />
      <AlertTitle>Document Locked</AlertTitle>
      <AlertDescription>
        This document is locked by {lockStatus.lockedByName || "another user"}.
        {lockStatus.canUnlock
          ? " You can unlock it to make changes."
          : " Only the person who locked it or an admin can unlock it."}
      </AlertDescription>
    </Alert>
  );
}

function usePlateEditorActions({
  documentId,
  document,
  isArchived,
  lockStatus,
  updateTitle,
  togglePublic,
  toggleFavorite,
  archiveDocument,
  unarchiveDocument,
  lockDocument,
  unlockDocument,
}: PlateEditorActionsArgs) {
  const handleTitleEdit = async (title: string) => {
    try {
      await updateTitle({ id: documentId, title });
      showSuccess("Title updated");
    } catch (error) {
      showError(error, "Failed to update title");
    }
  };

  const handleTogglePublic = async () => {
    if (!document) return;
    try {
      await togglePublic({ id: documentId });
      showSuccess(document.isPublic ? "Document is now private" : "Document is now public");
    } catch (error) {
      showError(error, "Failed to update document visibility");
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const result = await toggleFavorite({ documentId });
      showSuccess(result.isFavorite ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      showError(error, "Failed to update favorite");
    }
  };

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

  return {
    handleTitleEdit,
    handleTogglePublic,
    handleToggleFavorite,
    handleToggleArchive,
    handleToggleLock,
  };
}

function usePlateEditorUiState({
  documentId,
  document,
  versions,
  updateTitle,
}: UsePlateEditorUiStateArgs) {
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editorSeedValue, setEditorSeedValue] = useState<Value>(getInitialValue());
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [editorValue, setEditorValue] = useState<Value>(getInitialValue());

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
    const nextValue = latestVersion
      ? proseMirrorSnapshotToValue(latestVersion.snapshot)
      : getInitialValue();
    setEditorSeedValue(nextValue);
    setEditorValue(nextValue);
  }, [versions]);

  const handleChange = (value: Value) => {
    setEditorValue(value);
    console.debug("Editor content changed", value.length, "nodes");
  };

  const handleRestoreVersion = async (snapshot: unknown, version: number, title: string) => {
    void version;
    try {
      if (snapshot && document) {
        if (title !== document.title) {
          await updateTitle({ id: documentId, title });
        }
        showSuccess("Version restored successfully. Refreshing...");
        window.location.reload();
      }
    } catch (error) {
      showError(error, "Failed to restore version");
    }
  };

  const replaceEditorValue = (value: Value) => {
    setEditorSeedValue(value);
    setEditorValue(value);
    setEditorResetKey((prev) => prev + 1);
  };

  return {
    showVersionHistory,
    setShowVersionHistory,
    showMoveDialog,
    setShowMoveDialog,
    showSidebar,
    editorSeedValue,
    editorResetKey,
    editorValue,
    handleChange,
    replaceEditorValue,
    toggleSidebar: () => setShowSidebar((prev) => !prev),
    handleRestoreVersion,
  };
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
                  <Typography variant="eyebrowWide">Suggested outline</Typography>
                  <Typography variant="small" color="secondary">
                    Summary, decisions, follow-ups, owners, and review date.
                  </Typography>
                </Stack>
                <Stack gap="xs">
                  <Typography variant="eyebrowWide">Quick actions</Typography>
                  <Typography variant="small" color="secondary">
                    Turn decisions into checklists, link risks to issues, and assign owners while
                    the discussion is still fresh.
                  </Typography>
                </Stack>
              </Grid>
            </Stack>

            <div className="h-full p-4 bg-ui-bg/88 lg:col-span-2">
              <Stack gap="sm">
                <Stack gap="xs">
                  <Typography variant="eyebrowWide">Starter flow</Typography>
                  <Typography variant="small" color="secondary">
                    Capture the summary first, then turn action items into tasks or linked issues.
                  </Typography>
                </Stack>
                <Stack gap="xs">
                  <Typography variant="eyebrowWide">Suggested first section</Typography>
                  <Typography variant="small" color="secondary">
                    Add a short context paragraph, then break out the decisions, open risks, and
                    next steps before expanding into full notes.
                  </Typography>
                </Stack>
              </Stack>
            </div>
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

function usePlateEditorData(documentId: Id<"documents">): PlateEditorData {
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

  return {
    document,
    updateTitle,
    togglePublic,
    toggleFavorite,
    archiveDocument,
    unarchiveDocument,
    lockDocument,
    unlockDocument,
    isFavorite,
    isArchived,
    lockStatus,
    userId,
    versionCount,
    versions,
  };
}

function getDocumentHeaderLockStatus(lockStatus: PlateEditorLockStatus | undefined) {
  if (!lockStatus) {
    return undefined;
  }

  return {
    isLocked: lockStatus.isLocked,
    lockedByName: lockStatus.isLocked ? lockStatus.lockedByName : undefined,
    canUnlock: lockStatus.isLocked ? lockStatus.canUnlock : undefined,
  };
}

function LoadedPlateEditor({ documentId, data }: LoadedPlateEditorProps) {
  const {
    document,
    updateTitle,
    togglePublic,
    toggleFavorite,
    archiveDocument,
    unarchiveDocument,
    lockDocument,
    unlockDocument,
    isFavorite,
    isArchived,
    lockStatus,
    userId,
    versionCount,
    versions,
  } = data;

  const {
    showVersionHistory,
    setShowVersionHistory,
    showMoveDialog,
    setShowMoveDialog,
    showSidebar,
    editorSeedValue,
    editorResetKey,
    editorValue,
    handleChange,
    replaceEditorValue,
    toggleSidebar,
    handleRestoreVersion,
  } = usePlateEditorUiState({
    documentId,
    document,
    versions,
    updateTitle,
  });
  const [markdownImportPreview, setMarkdownImportPreview] = useState<MarkdownImportPreview | null>(
    null,
  );
  const isEmptyEditor = isEmptyValue(editorSeedValue);

  const {
    handleTitleEdit,
    handleTogglePublic,
    handleToggleFavorite,
    handleToggleArchive,
    handleToggleLock,
  } = usePlateEditorActions({
    documentId,
    document,
    isArchived: isArchived ?? false,
    lockStatus,
    updateTitle,
    togglePublic,
    toggleFavorite,
    archiveDocument,
    unarchiveDocument,
    lockDocument,
    unlockDocument,
  });

  const handleOpenMarkdownImportPreview = async () => {
    const preview = await readMarkdownForPreview();
    if (preview) {
      setMarkdownImportPreview(preview);
    }
  };

  const handleConfirmMarkdownImport = () => {
    if (!markdownImportPreview) {
      return;
    }

    try {
      replaceEditorValue(markdownToValue(markdownImportPreview.markdown));
      showSuccess(`Imported ${markdownImportPreview.filename}`);
      setMarkdownImportPreview(null);
    } catch (error) {
      showError(error, "Failed to import markdown file");
    }
  };

  return (
    <Flex direction="column" className="h-full bg-ui-bg">
      <DocumentHeader
        document={document}
        userId={userId}
        versionCount={versionCount}
        isFavorite={isFavorite ?? false}
        isArchived={isArchived ?? false}
        lockStatus={getDocumentHeaderLockStatus(lockStatus)}
        onTitleEdit={handleTitleEdit}
        onTogglePublic={handleTogglePublic}
        onToggleFavorite={handleToggleFavorite}
        onToggleArchive={handleToggleArchive}
        onToggleLock={handleToggleLock}
        onMoveToProject={() => setShowMoveDialog(true)}
        onImportMarkdown={handleOpenMarkdownImportPreview}
        onExportMarkdown={async () => {
          showError("Markdown export not yet implemented for Plate editor");
        }}
        onShowVersionHistory={() => setShowVersionHistory(true)}
        editorReady={true}
      />

      {lockStatus?.isLocked && <LockedDocumentBanner lockStatus={lockStatus} />}

      <Flex flex="1" className="overflow-hidden">
        <FlexItem flex="1" className="overflow-auto bg-ui-bg scrollbar-subtle">
          <Card padding="md" variant="ghost" className="mx-auto w-full max-w-5xl">
            <ErrorBoundary
              fallback={
                <div className="p-6 border border-status-error/20 bg-status-error-bg text-status-error text-center">
                  <Stack gap="sm">
                    <Typography variant="label">Editor failed to load</Typography>
                    <Typography variant="muted" className="opacity-80">
                      There was an issue initializing the rich text editor.
                    </Typography>
                  </Stack>
                </div>
              }
            >
              <EditorCanvas
                key={`${documentId}:${versions[0]?._id ?? "empty"}:${editorResetKey}`}
                initialEditorValue={editorSeedValue}
                isEmptyEditor={isEmptyEditor}
                isLocked={lockStatus?.isLocked === true}
                onChange={handleChange}
              />
            </ErrorBoundary>
          </Card>
        </FlexItem>

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

      <VersionHistory
        documentId={documentId}
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        onRestoreVersion={handleRestoreVersion}
      />

      <MoveDocumentDialog
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        documentId={documentId}
        currentProjectId={document.projectId}
        organizationId={document.organizationId}
      />

      <MarkdownPreviewModal
        open={markdownImportPreview !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMarkdownImportPreview(null);
          }
        }}
        onConfirm={handleConfirmMarkdownImport}
        markdown={markdownImportPreview?.markdown ?? ""}
        filename={markdownImportPreview?.filename ?? "document.md"}
      />
    </Flex>
  );
}

/**
 * Main editor component - renders the Plate editor with document sync
 */
export function PlateEditor({ documentId }: PlateEditorProps) {
  const data = usePlateEditorData(documentId);
  const { document, userId, versions } = data;

  if (document === undefined || userId === undefined || versions === undefined) {
    return <PlateEditorLoadingState versionsLoaded={versions !== undefined} />;
  }

  if (!userId) {
    return (
      <PlateEditorEmptyState
        title="Unable to load user data"
        description="There was a problem loading your editor session."
      />
    );
  }

  if (!document) {
    return (
      <PlateEditorEmptyState
        title="Document Not Found"
        description="This document doesn't exist or you don't have access to it."
        action={{
          label: "Go back",
          onClick: () => window.history.back(),
        }}
      />
    );
  }

  return (
    <LoadedPlateEditor documentId={documentId} data={{ ...data, document, userId, versions }} />
  );
}
