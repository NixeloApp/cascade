import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { DAY, HOUR, MINUTE } from "@convex/shared/time";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Clock, RotateCcw } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Dialog } from "./ui/Dialog";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Metadata, MetadataItem } from "./ui/Metadata";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

/**
 * Get relative time string (e.g., "5 minutes ago")
 * Returns null if diff is >= 7 days
 */
function getRelativeTimeString(diffMs: number): string | null {
  const diffMins = Math.floor(diffMs / MINUTE);
  const diffHours = Math.floor(diffMs / HOUR);
  const diffDays = Math.floor(diffMs / DAY);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  return null;
}

interface DocumentVersion {
  _id: Id<"documentVersions">;
  title: string;
  _creationTime: number;
  createdByName: string;
  changeDescription?: string;
}

interface VersionHistoryProps {
  documentId: Id<"documents">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestoreVersion?: (snapshot: unknown, version: number, title: string) => void;
}

export function VersionHistory({
  documentId,
  open,
  onOpenChange,
  onRestoreVersion,
}: VersionHistoryProps) {
  const [selectedVersionId, _setSelectedVersionId] = useState<Id<"documentVersions"> | null>(null);

  const versions = useQuery(api.documentVersions.listVersions, { documentId });
  const _selectedVersion = useQuery(
    api.documentVersions.getVersion,
    selectedVersionId ? { documentId, versionId: selectedVersionId } : "skip",
  );
  const restoreVersion = useMutation(api.documentVersions.restoreVersion);

  const handleRestore = async (versionId: Id<"documentVersions">) => {
    try {
      const result = await restoreVersion({ documentId, versionId });

      if (onRestoreVersion && result) {
        onRestoreVersion(result.snapshot, result.version, result.title);
        showSuccess("Version restored successfully");
        onOpenChange(false);
      }
    } catch (error) {
      showError(error, "Failed to restore version");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const relativeTime = getRelativeTimeString(diffMs);
    if (relativeTime) return relativeTime;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Version History"
      description="View and restore previous versions of this document"
      size="lg"
      className="flex flex-col bg-ui-bg-soft border-ui-border"
      footer={
        <Typography variant="meta">
          Tip: Versions are saved automatically every minute when you edit. Up to 50 recent versions
          are kept.
        </Typography>
      }
    >
      <FlexItem flex="1" className="overflow-auto scrollbar-subtle">
        {versions === undefined ? (
          <Card padding="xl" variant="ghost">
            <Flex align="center" justify="center">
              <LoadingSpinner size="lg" />
            </Flex>
          </Card>
        ) : versions.length === 0 ? (
          <Card padding="xl" variant="ghost" className="text-center">
            <Clock className="w-12 h-12 text-ui-text-tertiary mx-auto mb-4" />
            <Typography variant="h5" className="mb-2">
              No version history yet
            </Typography>
            <Typography variant="caption">
              Versions are automatically saved as you edit. Make some changes to create the first
              version.
            </Typography>
          </Card>
        ) : (
          <Card padding="xs" variant="ghost" radius="none">
            <Stack gap="sm">
              {versions.map((version: DocumentVersion, index: number) => {
                const isLatest = index === 0;
                const isSelected = selectedVersionId === version._id;

                return (
                  <Card
                    key={version._id}
                    padding="md"
                    className={cn(
                      "transition-default",
                      isSelected
                        ? "border-brand-ring bg-brand-subtle"
                        : "hover:border-ui-border-secondary hover:bg-ui-bg-hover",
                    )}
                  >
                    <Flex align="start" justify="between">
                      <FlexItem flex="1">
                        <Flex align="center" gap="sm" className="mb-1.5">
                          {isLatest && (
                            <Badge variant="success" size="sm">
                              Current
                            </Badge>
                          )}
                          <Typography variant="label">{version.title}</Typography>
                        </Flex>
                        <Metadata>
                          <MetadataItem icon={<Clock className="w-3.5 h-3.5" />}>
                            {formatDate(version._creationTime)}
                          </MetadataItem>
                          <MetadataItem>by {version.createdByName}</MetadataItem>
                        </Metadata>
                        {version.changeDescription && (
                          <Typography variant="caption" className="mt-2">
                            {version.changeDescription}
                          </Typography>
                        )}
                      </FlexItem>

                      {!isLatest && (
                        <Button
                          onClick={() => handleRestore(version._id)}
                          size="sm"
                          variant="outline"
                          className="ml-4 border-ui-border text-ui-text-secondary hover:text-ui-text hover:border-ui-border-secondary transition-default"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                          Restore
                        </Button>
                      )}
                    </Flex>
                  </Card>
                );
              })}
            </Stack>
          </Card>
        )}
      </FlexItem>
    </Dialog>
  );
}
