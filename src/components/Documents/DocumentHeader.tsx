/**
 * Document Header
 *
 * Header component for the document editor page.
 * Shows title, metadata, visibility status, and action buttons.
 * Supports title editing, locking, archiving, and import/export.
 */

import type { Doc } from "@convex/_generated/dataModel";
import { useState } from "react";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getDocumentHeaderActionButtonClassName,
  getDocumentHeaderToggleButtonClassName,
} from "@/components/ui/buttonSurfaceClassNames";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { getDocumentHeaderResponsiveWidthClassName } from "@/components/ui/documentHeaderSurfaceClassNames";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Input } from "@/components/ui/form/Input";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import { Stack } from "@/components/ui/Stack";
import { Tooltip } from "@/components/ui/Tooltip";
import { DocumentTitleText, Typography } from "@/components/ui/Typography";
import {
  Archive,
  Download,
  FolderInput,
  History,
  Lock,
  LockOpen,
  Menu,
  Star,
  Upload,
} from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";

interface LockStatus {
  isLocked: boolean;
  lockedByName?: string;
  canUnlock?: boolean;
}

interface DocumentHeaderProps {
  document: Doc<"documents"> & {
    creatorName: string;
    isOwner: boolean;
  };
  userId: string;
  versionCount: number | undefined;
  isFavorite: boolean;
  isArchived: boolean;
  lockStatus?: LockStatus;
  onTitleEdit: (title: string) => Promise<void>;
  onTogglePublic: () => Promise<void>;
  onToggleFavorite: () => Promise<void>;
  onToggleArchive: () => Promise<void>;
  onToggleLock?: () => Promise<void>;
  onMoveToProject?: () => void;
  onImportMarkdown: () => Promise<void>;
  onExportMarkdown: () => Promise<void>;
  onShowVersionHistory: () => void;
  editorReady: boolean;
  syncState?: "ready" | "saving" | "saved" | "error";
}

interface DocumentHeaderActionsProps {
  document: DocumentHeaderProps["document"];
  userId: string;
  versionCount: number | undefined;
  isFavorite: boolean;
  isArchived: boolean;
  onToggleFavorite: () => Promise<void>;
  onImportMarkdown: () => Promise<void>;
  onExportMarkdown: () => Promise<void>;
  onShowVersionHistory: () => void;
  editorReady: boolean;
  syncState?: DocumentHeaderProps["syncState"];
  ownerActions: {
    lockStatus?: LockStatus;
    onTogglePublic: () => Promise<void>;
    onToggleArchive: () => Promise<void>;
    onToggleLock?: () => Promise<void>;
    onMoveToProject?: () => void;
  };
}

function DocumentSyncStatusBadge({ syncState }: { syncState?: DocumentHeaderProps["syncState"] }) {
  if (syncState === "saving") {
    return <Badge variant="secondary">Saving…</Badge>;
  }

  if (syncState === "saved") {
    return <Badge variant="success">Saved</Badge>;
  }

  if (syncState === "error") {
    return <Badge variant="error">Save failed</Badge>;
  }

  return null;
}

interface OwnerDocumentActionsProps {
  document: DocumentHeaderProps["document"];
  isArchived: boolean;
  lockStatus?: LockStatus;
  onTogglePublic: () => Promise<void>;
  onToggleArchive: () => Promise<void>;
  onToggleLock?: () => Promise<void>;
  onMoveToProject?: () => void;
}

interface DocumentLockActionProps {
  lockStatus?: LockStatus;
  onToggleLock?: () => Promise<void>;
}

function DocumentLockAction({ lockStatus, onToggleLock }: DocumentLockActionProps) {
  if (!onToggleLock) {
    return null;
  }

  return (
    <DropdownMenuItem
      data-testid={
        lockStatus?.isLocked ? TEST_IDS.DOCUMENT.ACTION_UNLOCK : TEST_IDS.DOCUMENT.ACTION_LOCK
      }
      disabled={lockStatus?.isLocked && !lockStatus.canUnlock}
      icon={<Icon icon={lockStatus?.isLocked ? Lock : LockOpen} size="sm" aria-hidden="true" />}
      onSelect={() => {
        void onToggleLock();
      }}
    >
      {lockStatus?.isLocked ? "Unlock document" : "Lock document"}
    </DropdownMenuItem>
  );
}

function OwnerDocumentActions({
  document,
  isArchived,
  lockStatus,
  onTogglePublic,
  onToggleArchive,
  onToggleLock,
  onMoveToProject,
}: OwnerDocumentActionsProps) {
  if (!document.isOwner) {
    return null;
  }

  return (
    <Flex wrap align="center" gap="xs">
      <Button
        variant="unstyled"
        size="content"
        onClick={() => void onTogglePublic()}
        className={getDocumentHeaderToggleButtonClassName(document.isPublic)}
      >
        {document.isPublic ? "Public" : "Private"}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="More document actions"
            tooltip="More document actions"
            data-testid={TEST_IDS.DOCUMENT.HEADER_MORE_ACTIONS_BUTTON}
          >
            <Icon icon={Menu} size="sm" aria-hidden="true" />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" width="lg" data-testid={TEST_IDS.DOCUMENT.ACTION_MENU}>
          <DocumentLockAction lockStatus={lockStatus} onToggleLock={onToggleLock} />

          {onMoveToProject && (
            <DropdownMenuItem
              data-testid={TEST_IDS.DOCUMENT.ACTION_MOVE_TO_PROJECT}
              icon={<Icon icon={FolderInput} size="sm" aria-hidden="true" />}
              onSelect={() => {
                onMoveToProject();
              }}
            >
              Move to another project
            </DropdownMenuItem>
          )}

          {(onToggleLock || onMoveToProject) && <DropdownMenuSeparator />}

          <DropdownMenuItem
            icon={<Icon icon={Archive} size="sm" aria-hidden="true" />}
            onSelect={() => {
              void onToggleArchive();
            }}
          >
            {isArchived ? "Unarchive document" : "Archive document"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  );
}

function DocumentHeaderActions({
  document,
  userId,
  versionCount,
  isFavorite,
  isArchived,
  onToggleFavorite,
  onImportMarkdown,
  onExportMarkdown,
  onShowVersionHistory,
  editorReady,
  syncState,
  ownerActions,
}: DocumentHeaderActionsProps) {
  return (
    <Flex wrap align="center" gap="xs" className={getDocumentHeaderResponsiveWidthClassName()}>
      <PresenceIndicator roomId={document._id} userId={userId} />

      <DocumentSyncStatusBadge syncState={syncState} />

      <Tooltip content={isFavorite ? "Remove from favorites" : "Add to favorites"}>
        <IconButton
          variant={isFavorite ? "brand" : "ghost"}
          size="sm"
          onClick={() => void onToggleFavorite()}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
          data-testid={TEST_IDS.DOCUMENT.HEADER_FAVORITE_BUTTON}
          className={cn(isFavorite && "text-status-warning")}
        >
          <Icon
            icon={Star}
            size="sm"
            className={cn(isFavorite && "fill-current")}
            aria-hidden="true"
          />
        </IconButton>
      </Tooltip>

      <Tooltip content="View version history">
        <Button
          variant="unstyled"
          size="content"
          onClick={onShowVersionHistory}
          leftIcon={<Icon icon={History} size="sm" aria-hidden="true" />}
          aria-label="Version history"
          className={getDocumentHeaderActionButtonClassName("neutral")}
        >
          <Flex as="span" inline align="center" gap="xs">
            <Typography variant="small" as="span" className="hidden sm:inline">
              History
            </Typography>
            {versionCount !== undefined && versionCount > 0 ? (
              <Badge variant="secondary">{versionCount}</Badge>
            ) : null}
          </Flex>
        </Button>
      </Tooltip>

      <Tooltip content="Import from Markdown file">
        <Button
          variant="unstyled"
          size="content"
          onClick={() => void onImportMarkdown()}
          disabled={!editorReady}
          leftIcon={<Icon icon={Upload} size="sm" aria-hidden="true" />}
          aria-label="Import from Markdown"
          className={getDocumentHeaderActionButtonClassName("accent")}
        >
          <Typography variant="small" as="span" className="hidden sm:inline">
            Import
          </Typography>
        </Button>
      </Tooltip>

      <Tooltip content="Export as Markdown file">
        <Button
          variant="unstyled"
          size="content"
          onClick={() => void onExportMarkdown()}
          disabled={!editorReady}
          leftIcon={<Icon icon={Download} size="sm" aria-hidden="true" />}
          aria-label="Export as Markdown"
          className={getDocumentHeaderActionButtonClassName("accent")}
        >
          <Typography variant="small" as="span" className="hidden sm:inline">
            Export
          </Typography>
        </Button>
      </Tooltip>

      <OwnerDocumentActions
        document={document}
        isArchived={isArchived}
        lockStatus={ownerActions.lockStatus}
        onTogglePublic={ownerActions.onTogglePublic}
        onToggleArchive={ownerActions.onToggleArchive}
        onToggleLock={ownerActions.onToggleLock}
        onMoveToProject={ownerActions.onMoveToProject}
      />
    </Flex>
  );
}

/** Document header with title, metadata, and action buttons (favorite, archive, lock, export). */
export function DocumentHeader({
  document,
  userId,
  versionCount,
  isFavorite,
  isArchived,
  lockStatus,
  onTitleEdit,
  onTogglePublic,
  onToggleFavorite,
  onToggleArchive,
  onToggleLock,
  onMoveToProject,
  onImportMarkdown,
  onExportMarkdown,
  onShowVersionHistory,
  editorReady,
  syncState,
}: DocumentHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(document.title);

  const handleTitleEdit = () => {
    setTitleValue(document.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue !== document.title) {
      await onTitleEdit(titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleTitleSave();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  const titleComponent = document.isOwner ? (
    <Card
      variant="ghost"
      hoverable
      radius="md"
      padding="none"
      data-testid={TEST_IDS.DOCUMENT.TITLE}
      onClick={handleTitleEdit}
      className="inline-flex self-start border-transparent px-2 py-1 shadow-none"
    >
      <DocumentTitleText as="span">{document.title}</DocumentTitleText>
    </Card>
  ) : (
    <DocumentTitleText data-testid={TEST_IDS.DOCUMENT.TITLE}>{document.title}</DocumentTitleText>
  );

  return (
    <Card recipe="documentHeaderShell" padding="md">
      <Container size="5xl">
        <Stack gap="sm">
          <Flex
            direction="column"
            directionSm="row"
            align="start"
            alignSm="center"
            justify="between"
            gap="md"
          >
            <FlexItem flex="1" className={getDocumentHeaderResponsiveWidthClassName()}>
              {isEditingTitle ? (
                <Input
                  type="text"
                  data-testid={TEST_IDS.DOCUMENT.TITLE_INPUT}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={() => void handleTitleSave()}
                  onKeyDown={handleTitleKeyDown}
                  variant="documentTitle"
                />
              ) : document.isOwner ? (
                <Tooltip content="Click to edit title">{titleComponent}</Tooltip>
              ) : (
                titleComponent
              )}
            </FlexItem>
            <DocumentHeaderActions
              document={document}
              userId={userId}
              versionCount={versionCount}
              isFavorite={isFavorite}
              isArchived={isArchived}
              onToggleFavorite={onToggleFavorite}
              onImportMarkdown={onImportMarkdown}
              onExportMarkdown={onExportMarkdown}
              onShowVersionHistory={onShowVersionHistory}
              editorReady={editorReady}
              syncState={syncState}
              ownerActions={{
                lockStatus,
                onTogglePublic,
                onToggleArchive,
                onToggleLock,
                onMoveToProject,
              }}
            />
          </Flex>

          <Metadata size="sm">
            <MetadataItem>Created by {document.creatorName}</MetadataItem>
            <MetadataItem hideBelow="sm">
              Last updated <MetadataTimestamp date={document.updatedAt} format="absolute" />
            </MetadataItem>
          </Metadata>
        </Stack>
      </Container>
    </Card>
  );
}
