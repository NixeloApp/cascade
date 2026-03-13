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
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Input } from "@/components/ui/form/Input";
import { IconButton } from "@/components/ui/IconButton";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import { Stack } from "@/components/ui/Stack";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { Archive, Download, FolderInput, History, Lock, LockOpen, Star, Upload } from "@/lib/icons";
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
}

/** Document header with title, metadata, and action buttons (favorite, archive, lock, export). */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Header component with many conditional action buttons based on permissions
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

  const titleComponent = (
    <Typography
      as="h2"
      data-testid={TEST_IDS.DOCUMENT.TITLE}
      role={document.isOwner ? "button" : undefined}
      tabIndex={document.isOwner ? 0 : undefined}
      variant={document.isOwner ? "documentTitleInteractive" : "documentTitle"}
      onClick={document.isOwner ? handleTitleEdit : undefined}
      onKeyDown={
        document.isOwner
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleTitleEdit();
              }
            }
          : undefined
      }
    >
      {document.title}
    </Typography>
  );

  return (
    <Card recipe="documentHeaderShell" padding="md">
      <div className="mx-auto w-full max-w-5xl">
        <Stack gap="sm">
          <Flex
            direction="column"
            directionSm="row"
            align="start"
            alignSm="center"
            justify="between"
            gap="md"
          >
            <FlexItem flex="1" className="w-full sm:w-auto">
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

            <Flex wrap align="center" gap="xs" className="w-full sm:w-auto">
              <PresenceIndicator roomId={document._id} userId={userId} />

              {/* Favorite */}
              <Tooltip content={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                <IconButton
                  variant={isFavorite ? "brand" : "ghost"}
                  size="sm"
                  onClick={() => void onToggleFavorite()}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  aria-pressed={isFavorite}
                  className={cn(isFavorite && "text-status-warning")}
                >
                  <Star
                    className={cn("w-4 h-4", isFavorite && "fill-current")}
                    aria-hidden="true"
                  />
                </IconButton>
              </Tooltip>

              {/* Archive (owner only) */}
              {document.isOwner && (
                <Tooltip content={isArchived ? "Unarchive document" : "Archive document"}>
                  <IconButton
                    variant={isArchived ? "subtle" : "ghost"}
                    size="sm"
                    onClick={() => void onToggleArchive()}
                    aria-label={isArchived ? "Unarchive document" : "Archive document"}
                    aria-pressed={isArchived}
                    className={cn(isArchived && "text-ui-text-secondary")}
                  >
                    <Archive className="w-4 h-4" aria-hidden="true" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Lock (owner only) */}
              {document.isOwner && onToggleLock && (
                <Tooltip
                  content={
                    lockStatus?.isLocked
                      ? lockStatus.canUnlock
                        ? "Unlock document (currently locked)"
                        : `Locked by ${lockStatus.lockedByName || "another user"}`
                      : "Lock document to prevent editing"
                  }
                >
                  <IconButton
                    variant={lockStatus?.isLocked ? "subtle" : "ghost"}
                    size="sm"
                    onClick={() => void onToggleLock()}
                    disabled={lockStatus?.isLocked && !lockStatus.canUnlock}
                    aria-label={lockStatus?.isLocked ? "Unlock document" : "Lock document"}
                    aria-pressed={lockStatus?.isLocked}
                    className={cn(lockStatus?.isLocked && "text-status-warning")}
                  >
                    {lockStatus?.isLocked ? (
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <LockOpen className="w-4 h-4" aria-hidden="true" />
                    )}
                  </IconButton>
                </Tooltip>
              )}

              {/* Move to Project (owner only) */}
              {document.isOwner && onMoveToProject && (
                <Tooltip content="Move to another project">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={onMoveToProject}
                    aria-label="Move to another project"
                  >
                    <FolderInput className="w-4 h-4" aria-hidden="true" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Version History */}
              <Tooltip content="View version history">
                <Button
                  variant="unstyled"
                  chrome="documentHeaderNeutral"
                  chromeSize="documentHeaderAction"
                  onClick={onShowVersionHistory}
                  leftIcon={<History className="w-4 h-4" aria-hidden="true" />}
                  aria-label="Version history"
                >
                  <Typography variant="small" as="span" className="hidden sm:inline">
                    History
                  </Typography>
                  {versionCount !== undefined && versionCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {versionCount}
                    </Badge>
                  )}
                </Button>
              </Tooltip>

              {/* Import Markdown */}
              <Tooltip content="Import from Markdown file">
                <Button
                  variant="unstyled"
                  chrome="documentHeaderAccent"
                  chromeSize="documentHeaderAction"
                  onClick={() => void onImportMarkdown()}
                  disabled={!editorReady}
                  leftIcon={<Upload className="w-4 h-4" aria-hidden="true" />}
                  aria-label="Import from Markdown"
                >
                  <Typography variant="small" as="span" className="hidden sm:inline">
                    Import
                  </Typography>
                </Button>
              </Tooltip>

              {/* Export Markdown */}
              <Tooltip content="Export as Markdown file">
                <Button
                  variant="unstyled"
                  chrome="documentHeaderAccent"
                  chromeSize="documentHeaderAction"
                  onClick={() => void onExportMarkdown()}
                  disabled={!editorReady}
                  leftIcon={<Download className="w-4 h-4" aria-hidden="true" />}
                  aria-label="Export as Markdown"
                >
                  <Typography variant="small" as="span" className="hidden sm:inline">
                    Export
                  </Typography>
                </Button>
              </Tooltip>

              {document.isOwner && (
                <Button
                  variant="unstyled"
                  chrome={
                    document.isPublic ? "documentHeaderPublicActive" : "documentHeaderNeutral"
                  }
                  chromeSize="documentHeaderToggle"
                  onClick={() => void onTogglePublic()}
                >
                  {document.isPublic ? "Public" : "Private"}
                </Button>
              )}
            </Flex>
          </Flex>

          <Metadata size="sm">
            <MetadataItem>Created by {document.creatorName}</MetadataItem>
            <MetadataItem hideBelow="sm">
              Last updated <MetadataTimestamp date={document.updatedAt} format="absolute" />
            </MetadataItem>
          </Metadata>
        </Stack>
      </div>
    </Card>
  );
}
