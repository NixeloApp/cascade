/**
 * Version History
 *
 * Document version history panel with restore functionality.
 * Shows timestamped versions with author info and allows restoring.
 * Displays version diffs and metadata in a timeline format.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
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
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  return null;
}

interface DocumentVersion {
  _id: Id<"documentVersions">;
  version: number;
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

function stringifySnapshot(snapshot: unknown): string {
  try {
    return JSON.stringify(snapshot, null, 2);
  } catch {
    return String(snapshot);
  }
}

export function VersionHistory({
  documentId,
  open,
  onOpenChange,
  onRestoreVersion,
}: VersionHistoryProps) {
  const [compareVersionIds, setCompareVersionIds] = useState<Id<"documentVersions">[]>([]);

  const versions = useQuery(api.documentVersions.listVersions, { documentId });
  const leftVersion = useQuery(
    api.documentVersions.getVersion,
    compareVersionIds[0] ? { documentId, versionId: compareVersionIds[0] } : "skip",
  );
  const rightVersion = useQuery(
    api.documentVersions.getVersion,
    compareVersionIds[1] ? { documentId, versionId: compareVersionIds[1] } : "skip",
  );
  const restoreVersion = useMutation(api.documentVersions.restoreVersion);

  useEffect(() => {
    if (!open) {
      setCompareVersionIds([]);
    }
  }, [open]);

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

  const handleToggleCompare = (versionId: Id<"documentVersions">) => {
    setCompareVersionIds((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length < 2) {
        return [...prev, versionId];
      }
      return [prev[1], versionId];
    });
  };

  const isComparing = compareVersionIds.length === 2;
  const diffLeft = leftVersion?.snapshot ? stringifySnapshot(leftVersion.snapshot) : "";
  const diffRight = rightVersion?.snapshot ? stringifySnapshot(rightVersion.snapshot) : "";

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
              {isComparing && (
                <Card padding="md" className="border border-brand-ring/40 bg-brand-subtle/20">
                  <Flex align="center" justify="between" className="mb-3">
                    <Typography variant="label">Diff View</Typography>
                    <Button variant="ghost" size="sm" onClick={() => setCompareVersionIds([])}>
                      Clear Compare
                    </Button>
                  </Flex>
                  {leftVersion === undefined || rightVersion === undefined ? (
                    <Typography variant="small" color="secondary">
                      Loading versions for comparison...
                    </Typography>
                  ) : (
                    <Flex direction="column" gap="md" className="lg:flex-row">
                      <FlexItem flex="1">
                        <Typography variant="caption" className="mb-2 block">
                          Older: v{leftVersion?.version} {leftVersion?.title}
                        </Typography>
                        <pre className="max-h-64 overflow-auto rounded bg-ui-bg p-3 text-xs">
                          {diffLeft}
                        </pre>
                      </FlexItem>
                      <FlexItem flex="1">
                        <Typography variant="caption" className="mb-2 block">
                          Newer: v{rightVersion?.version} {rightVersion?.title}
                        </Typography>
                        <pre className="max-h-64 overflow-auto rounded bg-ui-bg p-3 text-xs">
                          {diffRight}
                        </pre>
                      </FlexItem>
                    </Flex>
                  )}
                </Card>
              )}

              {versions.map((version: DocumentVersion, index: number) => {
                const isLatest = index === 0;
                const isSelected = compareVersionIds.includes(version._id);

                return (
                  <Card
                    key={version._id}
                    padding="md"
                    hoverable={!isSelected}
                    className={cn(isSelected && "border-brand-ring bg-brand-subtle")}
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
                        <Flex align="center" gap="sm" className="ml-4">
                          <Button
                            onClick={() => handleToggleCompare(version._id)}
                            size="sm"
                            variant={isSelected ? "secondary" : "ghost"}
                          >
                            {isSelected ? "Compared" : "Compare"}
                          </Button>
                          <Button
                            onClick={() => handleRestore(version._id)}
                            size="sm"
                            variant="outline"
                            className="border-ui-border text-ui-text-secondary hover:text-ui-text hover:border-ui-border-secondary transition-default"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                            Restore
                          </Button>
                        </Flex>
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
