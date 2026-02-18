import type { Doc } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { Download, History, Upload } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { PresenceIndicator } from "./PresenceIndicator";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Input } from "./ui/form/Input";
import { Stack } from "./ui/Stack";

interface DocumentHeaderProps {
  document: Doc<"documents"> & {
    creatorName: string;
    isOwner: boolean;
  };
  userId: string;
  versionCount: number | undefined;
  onTitleEdit: (title: string) => Promise<void>;
  onTogglePublic: () => Promise<void>;
  onImportMarkdown: () => Promise<void>;
  onExportMarkdown: () => Promise<void>;
  onShowVersionHistory: () => void;
  editorReady: boolean;
}

export function DocumentHeader({
  document,
  userId,
  versionCount,
  onTitleEdit,
  onTogglePublic,
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
      variant="h1"
      role={document.isOwner ? "button" : undefined}
      tabIndex={document.isOwner ? 0 : undefined}
      className={cn(
        "text-xl sm:text-2xl font-semibold text-ui-text tracking-tight",
        "px-2 py-1 -ml-2 rounded transition-default",
        document.isOwner && "cursor-pointer hover:bg-ui-bg-hover",
      )}
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
    <Card
      variant="flat"
      padding="lg"
      radius="none"
      className="border-b border-ui-border border-x-0 border-t-0"
    >
      <Stack gap="md">
        <Flex
          direction="column"
          align="start"
          justify="between"
          gap="md"
          className="sm:flex-row sm:items-center sm:gap-4"
        >
          <FlexItem flex="1" className="w-full sm:w-auto">
            {isEditingTitle ? (
              <Input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={() => void handleTitleSave()}
                onKeyDown={handleTitleKeyDown}
                className="text-xl sm:text-2xl font-semibold tracking-tight bg-transparent border-none outline-none focus:ring-2 focus:ring-brand-ring rounded px-2 py-1 -ml-2 text-ui-text"
              />
            ) : document.isOwner ? (
              <Tooltip content="Click to edit title">{titleComponent}</Tooltip>
            ) : (
              titleComponent
            )}
          </FlexItem>

          <Flex wrap align="center" className="gap-1.5 sm:gap-2 w-full sm:w-auto">
            <PresenceIndicator roomId={document._id} userId={userId} />

            {/* Version History */}
            <Tooltip content="View version history">
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowVersionHistory}
                leftIcon={<History className="w-4 h-4" aria-hidden="true" />}
                className="px-2 sm:px-3 py-1.5 border border-ui-border text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover hover:border-ui-border-secondary transition-default min-h-0"
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
                variant="ghost"
                size="sm"
                onClick={() => void onImportMarkdown()}
                disabled={!editorReady}
                leftIcon={<Upload className="w-4 h-4" aria-hidden="true" />}
                className="px-2 sm:px-3 py-1.5 border border-ui-border text-ui-text-secondary hover:text-brand hover:bg-brand-subtle hover:border-brand-border transition-default min-h-0 disabled:opacity-50"
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
                variant="ghost"
                size="sm"
                onClick={() => void onExportMarkdown()}
                disabled={!editorReady}
                leftIcon={<Download className="w-4 h-4" aria-hidden="true" />}
                className="px-2 sm:px-3 py-1.5 border border-ui-border text-ui-text-secondary hover:text-brand hover:bg-brand-subtle hover:border-brand-border transition-default min-h-0 disabled:opacity-50"
                aria-label="Export as Markdown"
              >
                <Typography variant="small" as="span" className="hidden sm:inline">
                  Export
                </Typography>
              </Button>
            </Tooltip>

            {document.isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void onTogglePublic()}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 min-h-0 text-sm border transition-default",
                  document.isPublic
                    ? "border-status-success/30 bg-status-success-bg text-status-success-text hover:bg-status-success-bg/80"
                    : "border-ui-border text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover hover:border-ui-border-secondary",
                )}
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
    </Card>
  );
}
