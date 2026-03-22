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
import type { MutableRefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { PlateRichTextContent } from "@/components/ui/PlateRichTextContent";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { FileText, ListTodo, Lock, Sparkles } from "@/lib/icons";
import {
  getEditorPlugins,
  getInitialValue,
  isEmptyValue,
  plateValueToProseMirrorSnapshot,
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
import { SectionErrorFallback } from "./SectionErrorFallback";
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

type DocumentSyncState = "ready" | "saving" | "saved" | "error";

interface UsePlateDocumentSyncArgs {
  documentId: Id<"documents">;
  document: PlateEditorDocument | null | undefined;
  latestSnapshot: ReturnType<typeof useAuthenticatedQuery<typeof api.prosemirror.getSnapshot>>;
  latestVersion: ReturnType<typeof useAuthenticatedQuery<typeof api.prosemirror.latestVersion>>;
  versions: PlateEditorVersions | undefined;
  submitSnapshot: ReturnType<
    typeof useAuthenticatedMutation<typeof api.prosemirror.submitSnapshot>
  >["mutate"];
  updateTitle: (args: { id: Id<"documents">; title: string }) => Promise<unknown>;
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
  latestSnapshot: ReturnType<typeof useAuthenticatedQuery<typeof api.prosemirror.getSnapshot>>;
  latestVersion: ReturnType<typeof useAuthenticatedQuery<typeof api.prosemirror.latestVersion>>;
  submitSnapshot: ReturnType<
    typeof useAuthenticatedMutation<typeof api.prosemirror.submitSnapshot>
  >["mutate"];
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

const DOCUMENT_SAVE_DEBOUNCE_MS = 1200;
const SAVE_RETRY_DELAY_MS = 3000;

interface E2EEditorMarkdownEventDetail {
  markdown: string;
}

interface E2EEditorValueEventDetail {
  value: Value;
}

const DOCUMENT_STARTER_SECTIONS = [
  {
    title: "Capture the context",
    description:
      "Open with the situation, the decision that needs to land, and the constraint the team should keep in mind.",
    icon: FileText,
  },
  {
    title: "Turn notes into action",
    description:
      "Use checklists and linked issues while the discussion is still fresh so the document stays operational.",
    icon: ListTodo,
  },
  {
    title: "Keep the trail visible",
    description:
      "Summaries, owners, and follow-ups belong in the doc so launch reviews do not depend on chat archaeology.",
    icon: Sparkles,
  },
] as const;

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
    <Flex align="center" justify="center" className="h-full px-4 py-8">
      <EmptyState
        icon={FileText}
        title={title}
        description={description}
        surface="bare"
        action={
          action
            ? {
                label: action.label,
                onClick: action.onClick,
              }
            : undefined
        }
      />
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
      <Lock className="size-4" />
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
  versions,
}: Omit<UsePlateEditorUiStateArgs, "documentId" | "document" | "updateTitle">) {
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(min-width: 1280px)").matches) {
      setShowSidebar(true);
    }
  }, []);

  useEffect(() => {
    if (versions && versions.length === 0) {
      setShowVersionHistory(false);
    }
  }, [versions]);

  return {
    showVersionHistory,
    setShowVersionHistory,
    showMoveDialog,
    setShowMoveDialog,
    showSidebar,
    toggleSidebar: () => setShowSidebar((prev) => !prev),
  };
}

function serializeSnapshot(snapshot: unknown): string {
  return JSON.stringify(snapshot);
}

function clearTimeoutRef(timeoutRef: MutableRefObject<number | null>) {
  if (timeoutRef.current !== null) {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}

function getSerializedPlateValue(value: Value): string {
  return serializeSnapshot(plateValueToProseMirrorSnapshot(value));
}

function getSeedValueFromSnapshot(latestSnapshot: unknown): Value {
  return latestSnapshot ? proseMirrorSnapshotToValue(latestSnapshot) : getInitialValue();
}

function createRestoredVersionPayload(snapshot: unknown, version: number, currentVersion: number) {
  return {
    content: serializeSnapshot(snapshot),
    nextVersion: Math.max(currentVersion, version) + 1,
    value: proseMirrorSnapshotToValue(snapshot),
  };
}

function usePlateDocumentSync({
  documentId,
  document,
  latestSnapshot,
  latestVersion,
  versions,
  submitSnapshot,
  updateTitle,
}: UsePlateDocumentSyncArgs) {
  const [editorSeedValue, setEditorSeedValue] = useState<Value>(getInitialValue());
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [editorValue, setEditorValue] = useState<Value>(getInitialValue());
  const [syncState, setSyncState] = useState<DocumentSyncState>("ready");
  const saveTimeoutRef = useRef<number | null>(null);
  const saveStateTimeoutRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);
  const currentVersionRef = useRef(0);
  const lastSavedContentRef = useRef(getSerializedPlateValue(getInitialValue()));
  const pendingContentRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (latestSnapshot === undefined || latestVersion === undefined) {
      return;
    }

    // When there is no ProseMirror sync snapshot, fall back to the most
    // recent version history snapshot so older documents aren't shown as blank.
    const effectiveSnapshot =
      latestSnapshot ?? (versions && versions.length > 0 ? versions[0].snapshot : null);

    const serializedSnapshot = effectiveSnapshot
      ? serializeSnapshot(effectiveSnapshot)
      : getSerializedPlateValue(getInitialValue());

    // After initial hydration, only reset the editor when the incoming
    // snapshot actually differs from what we last saved. This prevents
    // our own autosave acknowledgments from remounting the editor and
    // causing cursor/selection jumps.
    if (hydratedRef.current && serializedSnapshot === lastSavedContentRef.current) {
      currentVersionRef.current = latestVersion ?? 0;
      return;
    }

    const nextValue = getSeedValueFromSnapshot(effectiveSnapshot);

    currentVersionRef.current = latestVersion ?? 0;
    lastSavedContentRef.current = serializedSnapshot;
    pendingContentRef.current = null;
    hydratedRef.current = true;
    setEditorSeedValue(nextValue);
    setEditorValue(nextValue);
    setEditorResetKey((prev) => prev + 1);
    setSyncState("ready");
  }, [latestSnapshot, latestVersion, versions]);

  useEffect(
    () => () => {
      clearTimeoutRef(saveTimeoutRef);
      clearTimeoutRef(saveStateTimeoutRef);
    },
    [],
  );

  const markSaved = useCallback(() => {
    setSyncState("saved");
    clearTimeoutRef(saveStateTimeoutRef);
    saveStateTimeoutRef.current = window.setTimeout(() => {
      setSyncState((current) => (current === "saved" ? "ready" : current));
      saveStateTimeoutRef.current = null;
    }, 1500);
  }, []);

  const persistSnapshot = useCallback(
    async (content: string) => {
      if (isSavingRef.current) {
        pendingContentRef.current = content;
        return;
      }

      isSavingRef.current = true;
      setSyncState("saving");
      const nextVersion = currentVersionRef.current + 1;

      try {
        await submitSnapshot({
          id: documentId,
          version: nextVersion,
          content,
        });
        currentVersionRef.current = nextVersion;
        lastSavedContentRef.current = content;
        markSaved();
      } catch (error) {
        setSyncState("error");
        showError(error, "Failed to save document");
        // Schedule a retry so unsaved content is not lost after a transient failure.
        // Only set the failed content for retry if the user hasn't queued newer edits.
        if (!pendingContentRef.current) {
          pendingContentRef.current = content;
        }
        saveTimeoutRef.current = window.setTimeout(() => {
          saveTimeoutRef.current = null;
          const retryContent = pendingContentRef.current;
          pendingContentRef.current = null;
          if (retryContent && retryContent !== lastSavedContentRef.current) {
            void persistSnapshot(retryContent);
          }
        }, SAVE_RETRY_DELAY_MS);
        return;
      } finally {
        isSavingRef.current = false;
      }

      const pendingContent = pendingContentRef.current;
      pendingContentRef.current = null;
      if (pendingContent && pendingContent !== lastSavedContentRef.current) {
        void persistSnapshot(pendingContent);
      }
    },
    [documentId, markSaved, submitSnapshot],
  );

  useEffect(() => {
    if (latestSnapshot === undefined || latestVersion === undefined) {
      return;
    }

    const nextContent = getSerializedPlateValue(editorValue);
    if (nextContent === lastSavedContentRef.current) {
      return;
    }

    clearTimeoutRef(saveTimeoutRef);

    saveTimeoutRef.current = window.setTimeout(() => {
      void persistSnapshot(nextContent);
      saveTimeoutRef.current = null;
    }, DOCUMENT_SAVE_DEBOUNCE_MS);

    return () => {
      clearTimeoutRef(saveTimeoutRef);
    };
  }, [editorValue, latestSnapshot, latestVersion, persistSnapshot]);

  const handleChange = (value: Value) => {
    setEditorValue(value);
  };

  const replaceEditorValue = (
    value: Value,
    options?: { savedSnapshot?: unknown; version?: number },
  ) => {
    setEditorSeedValue(value);
    setEditorValue(value);
    setEditorResetKey((prev) => prev + 1);

    if (options?.savedSnapshot) {
      lastSavedContentRef.current = serializeSnapshot(options.savedSnapshot);
    }

    if (typeof options?.version === "number") {
      currentVersionRef.current = options.version;
    }
  };

  const handleRestoreVersion = async (snapshot: unknown, version: number, title: string) => {
    try {
      // Cancel any pending autosave so it doesn't race with the restore
      // and consume the version number we're about to use.
      clearTimeoutRef(saveTimeoutRef);
      pendingContentRef.current = null;

      // Wait for any in-flight autosave to finish so its version increment
      // is reflected in currentVersionRef before we compute the restore target.
      if (isSavingRef.current) {
        await new Promise<void>((resolve) => {
          const check = () => {
            if (!isSavingRef.current) {
              resolve();
            } else {
              window.setTimeout(check, 50);
            }
          };
          check();
        });
      }

      // Clear again after the wait — a failed in-flight autosave may have
      // repopulated pendingContentRef and scheduled a retry during the wait.
      clearTimeoutRef(saveTimeoutRef);
      pendingContentRef.current = null;

      setSyncState("saving");

      // Compute the target version right before submit to avoid races
      // with any autosave that may have just completed.
      const restoredVersion = createRestoredVersionPayload(
        snapshot,
        version,
        currentVersionRef.current,
      );

      await submitSnapshot({
        id: documentId,
        version: restoredVersion.nextVersion,
        content: restoredVersion.content,
      });

      // Only update title after snapshot succeeds to avoid partial restores
      // where metadata changed but content did not.
      if (document && title !== document.title) {
        await updateTitle({ id: documentId, title });
      }

      replaceEditorValue(restoredVersion.value, {
        savedSnapshot: snapshot,
        version: restoredVersion.nextVersion,
      });
      markSaved();
      showSuccess("Version restored successfully");
    } catch (error) {
      setSyncState("error");
      showError(error, "Failed to restore version");
    }
  };

  return {
    editorSeedValue,
    editorResetKey,
    editorValue,
    handleChange,
    replaceEditorValue,
    handleRestoreVersion,
    syncState,
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
          padding="md"
          variant="soft"
          className="mb-5 border-ui-border-secondary/85 bg-linear-to-br from-ui-bg via-ui-bg-elevated/96 to-ui-bg-secondary/78"
        >
          <Stack gap="md">
            <Flex align="start" justify="between" gap="md" wrap>
              <Stack gap="xs" className="max-w-2xl">
                <Badge variant="secondary" shape="pill">
                  Blank document
                </Badge>
                <Typography variant="h5">
                  Start with the handoff context, then turn the note into operational follow-up.
                </Typography>
                <Typography variant="small" color="secondary">
                  Use `/` for headings, lists, quotes, and code blocks once you begin writing. The
                  strongest docs keep the summary, decisions, owners, and next steps in one place.
                </Typography>
              </Stack>

              <Badge variant="outline" shape="pill">
                / for blocks
              </Badge>
            </Flex>

            <Flex wrap gap="sm">
              <Badge variant="secondary" shape="pill">
                Summary
              </Badge>
              <Badge variant="secondary" shape="pill">
                Decisions
              </Badge>
              <Badge variant="secondary" shape="pill">
                Risks
              </Badge>
              <Badge variant="secondary" shape="pill">
                Owners
              </Badge>
              <Badge variant="secondary" shape="pill">
                Next steps
              </Badge>
            </Flex>

            <Grid cols={1} colsMd={3} gap="md">
              {DOCUMENT_STARTER_SECTIONS.map((section) => (
                <Card key={section.title} variant="section" padding="md" className="h-full">
                  <Stack gap="sm">
                    <Badge variant="outline" shape="pill" className="w-fit">
                      <Flex as="span" align="center" gap="xs">
                        <Icon icon={section.icon} size="sm" />
                        <span>{section.title}</span>
                      </Flex>
                    </Badge>
                    <Typography variant="small" color="secondary">
                      {section.description}
                    </Typography>
                  </Stack>
                </Card>
              ))}
            </Grid>
          </Stack>
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
  const { mutate: submitSnapshot } = useAuthenticatedMutation(api.prosemirror.submitSnapshot);
  const isFavorite = useAuthenticatedQuery(api.documents.isFavorite, { documentId });
  const isArchived = useAuthenticatedQuery(api.documents.isArchived, { documentId });
  const lockStatus = useAuthenticatedQuery(api.documents.getLockStatus, { documentId });
  const userId = useAuthenticatedQuery(api.presence.getUserId, {});
  const versionCount = useAuthenticatedQuery(api.documentVersions.getVersionCount, { documentId });
  const versions = useAuthenticatedQuery(api.documentVersions.listVersions, { documentId });
  const latestSnapshot = useAuthenticatedQuery(api.prosemirror.getSnapshot, { id: documentId });
  const latestVersion = useAuthenticatedQuery(api.prosemirror.latestVersion, { id: documentId });

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
    latestSnapshot,
    latestVersion,
    submitSnapshot,
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
    latestSnapshot,
    latestVersion,
    submitSnapshot,
  } = data;

  const {
    showVersionHistory,
    setShowVersionHistory,
    showMoveDialog,
    setShowMoveDialog,
    showSidebar,
    toggleSidebar,
  } = usePlateEditorUiState({
    versions,
  });
  const {
    editorSeedValue,
    editorResetKey,
    editorValue,
    handleChange,
    replaceEditorValue,
    handleRestoreVersion,
    syncState,
  } = usePlateDocumentSync({
    documentId,
    document,
    latestSnapshot,
    latestVersion,
    versions,
    submitSnapshot,
    updateTitle,
  });
  const [markdownImportPreview, setMarkdownImportPreview] = useState<MarkdownImportPreview | null>(
    null,
  );
  const isEmptyEditor = isEmptyValue(editorSeedValue);

  useEffect(() => {
    const handleE2EEditorMarkdown = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const detail = event.detail as E2EEditorMarkdownEventDetail | undefined;
      if (typeof detail?.markdown !== "string") {
        return;
      }

      try {
        replaceEditorValue(markdownToValue(detail.markdown));
      } catch (error) {
        showError(error, "Failed to load e2e editor markdown");
      }
    };

    const handleE2EEditorValue = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const detail = event.detail as E2EEditorValueEventDetail | undefined;
      if (!Array.isArray(detail?.value)) {
        return;
      }

      replaceEditorValue(detail.value);
    };

    window.addEventListener("nixelo:e2e-set-editor-markdown", handleE2EEditorMarkdown);
    window.addEventListener("nixelo:e2e-set-editor-value", handleE2EEditorValue);
    return () => {
      window.removeEventListener("nixelo:e2e-set-editor-markdown", handleE2EEditorMarkdown);
      window.removeEventListener("nixelo:e2e-set-editor-value", handleE2EEditorValue);
    };
  }, [replaceEditorValue]);

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
    try {
      const preview = await readMarkdownForPreview();
      if (preview) {
        setMarkdownImportPreview(preview);
      }
    } catch (error) {
      showError(error, "Failed to read markdown file");
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
        editorReady={syncState !== "saving"}
        syncState={syncState}
      />

      {lockStatus?.isLocked && <LockedDocumentBanner lockStatus={lockStatus} />}

      <Flex flex="1" className="overflow-hidden">
        <FlexItem flex="1" className="overflow-auto bg-ui-bg scrollbar-subtle">
          <Card padding="md" variant="ghost" className="mx-auto w-full max-w-5xl">
            <ErrorBoundary
              fallback={
                <SectionErrorFallback
                  title="Editor failed to load"
                  message="There was an issue initializing the rich text editor."
                />
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
  const { document, userId, versions, latestSnapshot, latestVersion } = data;

  if (
    document === undefined ||
    userId === undefined ||
    versions === undefined ||
    latestSnapshot === undefined ||
    latestVersion === undefined
  ) {
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
