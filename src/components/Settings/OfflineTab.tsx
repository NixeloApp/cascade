/**
 * Offline Settings Tab
 *
 * Displays connection status and offline sync information.
 * Shows queued offline changes and sync controls.
 * Lists available offline features and capabilities.
 */

import { useState } from "react";
import { Check, RefreshCw, RotateCcw, Trash2, Wifi, WifiOff, X } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showInfo } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useOfflineQueue, useOnlineStatus } from "../../hooks/useOffline";
import type { OfflineMutation } from "../../lib/offline";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

function getQueueStatusSummary(
  isOnline: boolean,
  syncingCount: number,
  failedCount: number,
  pendingCount: number,
): string {
  if (failedCount > 0) {
    return "Needs attention";
  }
  if (syncingCount > 0) {
    return "Syncing";
  }
  if (pendingCount > 0) {
    return isOnline ? "Queued" : "Offline";
  }
  return isOnline ? "Ready" : "Offline";
}

function getQueueBadgeVariant(status: "pending" | "syncing" | "synced" | "failed") {
  if (status === "failed") {
    return "error";
  }
  if (status === "syncing") {
    return "info";
  }
  if (status === "synced") {
    return "success";
  }
  return "warning";
}

function formatLastSuccessfulReplay(lastSuccessfulReplayAt: number | null): string {
  return lastSuccessfulReplayAt === null
    ? "Never"
    : new Date(lastSuccessfulReplayAt).toLocaleString();
}

function getCapabilityLimitCopy(
  hasServiceWorkerSupport: boolean,
  hasBackgroundSyncSupport: boolean,
): { title: string; body: string } | null {
  if (!hasServiceWorkerSupport) {
    return {
      title: "Service worker features are unavailable here",
      body: "This browser cannot register the app worker, so offline fallback, install prompts, and push features will not work in this session.",
    };
  }

  if (!hasBackgroundSyncSupport) {
    return {
      title: "Background sync is best-effort only",
      body: "Queued changes replay only while the app is open: on reconnect, on startup, or when you use Process Queue manually.",
    };
  }

  return null;
}

const QUEUE_PREVIEW_LIMIT = 5;

function getVisibleQueueItems(queue: OfflineMutation[], showAll: boolean): OfflineMutation[] {
  if (showAll) {
    return queue;
  }
  // Always show all failed items, then fill remaining slots with non-failed items
  const failed = queue.filter((item) => item.status === "failed");
  const nonFailed = queue.filter((item) => item.status !== "failed");
  const remainingSlots = Math.max(0, QUEUE_PREVIEW_LIMIT - failed.length);
  return [...failed, ...nonFailed.slice(0, remainingSlots)];
}

function QueueItemList({
  queue,
  showAll,
  onToggleShowAll,
  activeMutationId,
  onRetry,
  onDelete,
}: {
  queue: OfflineMutation[];
  showAll: boolean;
  onToggleShowAll: () => void;
  activeMutationId: number | null;
  onRetry: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const visible = getVisibleQueueItems(queue, showAll);
  const hiddenCount = queue.length - visible.length;

  return (
    <Stack gap="sm">
      {visible.map((item) => (
        <Card key={item.id} variant="section" padding="sm">
          <Stack gap="sm">
            <Flex justify="between" align="center">
              <Stack gap="none">
                <Typography variant="label">{item.mutationType}</Typography>
                <Typography variant="caption">
                  {new Date(item.timestamp).toLocaleString()}
                </Typography>
              </Stack>
              <Badge variant={getQueueBadgeVariant(item.status)} size="md">
                {item.status === "syncing"
                  ? "Syncing"
                  : item.status === "failed"
                    ? "Failed"
                    : "Pending"}
              </Badge>
            </Flex>
            {item.error && (
              <Typography variant="caption" color="secondary">
                {item.error}
              </Typography>
            )}
            {item.status === "failed" && item.id !== undefined && (
              <Flex gap="sm" justify="end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRetry(item.id ?? 0)}
                  isLoading={activeMutationId === item.id}
                >
                  <Icon icon={RotateCcw} size="sm" />
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id ?? 0)}
                  isLoading={activeMutationId === item.id}
                >
                  <Icon icon={Trash2} size="sm" />
                  Remove
                </Button>
              </Flex>
            )}
          </Stack>
        </Card>
      ))}
      {hiddenCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onToggleShowAll} className="mx-auto">
          Show all ({queue.length} items)
        </Button>
      )}
      {showAll && queue.length > QUEUE_PREVIEW_LIMIT && (
        <Button variant="ghost" size="sm" onClick={onToggleShowAll} className="mx-auto">
          Show less
        </Button>
      )}
    </Stack>
  );
}

/**
 * Offline mode settings tab
 * Extracted from Settings for better organization
 */
export function OfflineTab() {
  const isOnline = useOnlineStatus();
  const { user } = useCurrentUser();
  const {
    queue,
    count,
    pendingCount,
    syncingCount,
    failedCount,
    lastSuccessfulReplayAt,
    isLoading,
    refresh,
    processNow,
    retryMutation,
    deleteMutation,
  } = useOfflineQueue();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [activeMutationId, setActiveMutationId] = useState<number | null>(null);
  const [showAllQueueItems, setShowAllQueueItems] = useState(false);
  const hasServiceWorkerSupport = typeof navigator !== "undefined" && "serviceWorker" in navigator;
  const hasBackgroundSyncSupport =
    typeof ServiceWorkerRegistration !== "undefined" &&
    hasServiceWorkerSupport &&
    "sync" in ServiceWorkerRegistration.prototype;
  const capabilityLimitCopy = getCapabilityLimitCopy(
    hasServiceWorkerSupport,
    hasBackgroundSyncSupport,
  );

  const handleRefreshQueue = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      showInfo("Local offline queue refreshed");
    } catch (error) {
      showError(error, "Failed to refresh offline queue");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRetryMutation = async (id: number) => {
    setActiveMutationId(id);
    try {
      await retryMutation(id);
      showInfo("Queued item marked for retry");
    } catch (error) {
      showError(error, "Failed to retry queued item");
    } finally {
      setActiveMutationId(null);
    }
  };

  const handleDeleteMutation = async (id: number) => {
    setActiveMutationId(id);
    try {
      await deleteMutation(id);
      showInfo("Queued item removed");
    } catch (error) {
      showError(error, "Failed to remove queued item");
    } finally {
      setActiveMutationId(null);
    }
  };

  const handleProcessQueue = async () => {
    setIsProcessingQueue(true);
    try {
      const { processed } = await processNow(user?._id);
      if (processed) {
        showInfo("Queued items processed");
      }
    } catch (error) {
      showError(error, "Failed to process offline queue");
    } finally {
      setIsProcessingQueue(false);
    }
  };

  return (
    <Flex direction="column" gap="xl">
      {/* Connection Status */}
      <Card padding="lg" data-testid={TEST_IDS.SETTINGS.OFFLINE_STATUS_CARD}>
        <Grid cols={1} colsLg={5} gap="lg" className="items-stretch">
          <Card variant="section" padding="md">
            <Flex gap="md" align="center">
            <div className={cn("p-2", isOnline ? "bg-status-success" : "bg-status-error")}>
              {isOnline ? (
                <Wifi className="size-6 text-brand-foreground" />
              ) : (
                <WifiOff className="size-6 text-brand-foreground" />
              )}
            </div>
            <Stack gap="xs">
              <Typography variant="label">Connection</Typography>
              <Typography
                variant="small"
                as="span"
                className={isOnline ? "text-status-success" : "text-status-error"}
              >
                <Flex as="span" align="center" gap="xs">
                  {isOnline ? <Icon icon={Check} size="sm" /> : <Icon icon={X} size="sm" />}
                  {isOnline ? "Online" : "Offline"}
                </Flex>
              </Typography>
            </Stack>
            </Flex>
          </Card>
          <Card variant="section" padding="md">
            <Stack gap="xs">
              <Typography variant="small" color="secondary">
                Queued Items
              </Typography>
              <Typography variant="h2">{isLoading ? "..." : count}</Typography>
            </Stack>
          </Card>
          <Card variant="section" padding="md">
            <Stack gap="xs">
              <Typography variant="small" color="secondary">
                Sync Status
              </Typography>
              <Typography variant="h2">
                {getQueueStatusSummary(isOnline, syncingCount, failedCount, pendingCount)}
              </Typography>
            </Stack>
          </Card>
          <Card variant="section" padding="md">
            <Stack gap="xs">
              <Typography variant="small" color="secondary">
                Last Successful Replay
              </Typography>
              <Typography variant="label">
                {formatLastSuccessfulReplay(lastSuccessfulReplayAt)}
              </Typography>
            </Stack>
          </Card>
          <Card variant="section" padding="md">
            <Stack gap="xs">
              <Typography variant="small" color="secondary">
                Storage
              </Typography>
              <Typography variant="h2">IndexedDB</Typography>
            </Stack>
          </Card>
        </Grid>
      </Card>

      <Card padding="lg">
        <Stack gap="sm">
          <Typography variant="h3">Offline Status</Typography>
          <Typography variant="small" color="secondary">
            This screen currently reports the local IndexedDB queue and browser connectivity only.
            End-to-end replay, install prompts, and service-worker ownership are still under audit.
          </Typography>
          <Grid cols={1} colsSm={2} gap="md">
            <Card variant="section" padding="md">
              <Stack gap="xs">
                <Typography variant="small" color="secondary">
                  Service Worker Support
                </Typography>
                <Typography variant="label">
                  {hasServiceWorkerSupport ? "Detected" : "Unavailable"}
                </Typography>
              </Stack>
            </Card>
            <Card variant="section" padding="md">
              <Stack gap="xs">
                <Typography variant="small" color="secondary">
                  Background Sync Support
                </Typography>
                <Typography variant="label">
                  {hasBackgroundSyncSupport ? "Detected" : "Unavailable"}
                </Typography>
              </Stack>
            </Card>
          </Grid>
          {capabilityLimitCopy && (
            <Alert variant="warning">
              <AlertTitle>{capabilityLimitCopy.title}</AlertTitle>
              <AlertDescription>{capabilityLimitCopy.body}</AlertDescription>
            </Alert>
          )}
        </Stack>
      </Card>

      {/* Verified local capabilities */}
      <Card padding="lg">
        <Stack gap="lg">
          <Typography variant="h3">Current Verified Capabilities</Typography>
          <Stack gap="lg">
            <Flex gap="md" align="start">
              <Icon icon={Check} size="sm" className="mt-0.5 text-status-success" />
              <Stack gap="xs">
                <Typography variant="label">Connectivity Tracking</Typography>
                <Typography variant="small" color="secondary">
                  The app tracks browser online and offline state in the client.
                </Typography>
              </Stack>
            </Flex>
            <Flex gap="md" align="start">
              <Icon icon={Check} size="sm" className="mt-0.5 text-status-success" />
              <Stack gap="xs">
                <Typography variant="label">Local Queue Visibility</Typography>
                <Typography variant="small" color="secondary">
                  Pending local offline items are stored in IndexedDB and listed below when present.
                </Typography>
              </Stack>
            </Flex>
            <Flex gap="md" align="start">
              <Icon icon={Check} size="sm" className="mt-0.5 text-status-success" />
              <Stack gap="xs">
                <Typography variant="label">Fallback Offline Page</Typography>
                <Typography variant="small" color="secondary">
                  The shipped service worker includes an offline fallback page for navigation
                  failures.
                </Typography>
              </Stack>
            </Flex>
            <Flex gap="md" align="start">
              <Icon icon={X} size="sm" className="mt-0.5 text-status-error" />
              <Stack gap="xs">
                <Typography variant="label">Replay And Install Flow</Typography>
                <Typography variant="small" color="secondary">
                  Automatic replay, install prompting, and worker ownership are not yet verified as
                  a single coherent runtime path.
                </Typography>
              </Stack>
            </Flex>
          </Stack>
        </Stack>
      </Card>

      {/* Sync Queue */}
      {count > 0 && (
        <Card padding="lg">
          <Stack gap="md">
            <Flex justify="between" align="center">
              <Stack gap="xs">
                <Typography variant="h3">Local Offline Queue</Typography>
                <Typography variant="small" color="secondary">
                  This list reflects local IndexedDB entries, not confirmed server-side sync state.
                </Typography>
              </Stack>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefreshQueue}
                isLoading={isRefreshing}
              >
                <Icon icon={RefreshCw} size="sm" />
                Refresh Queue
              </Button>
            </Flex>
            {pendingCount > 0 && isOnline && user?._id && (
              <Flex justify="end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleProcessQueue}
                  isLoading={isProcessingQueue}
                >
                  <Icon icon={RefreshCw} size="sm" />
                  Process Queue
                </Button>
              </Flex>
            )}
            <Grid cols={1} colsSm={3} gap="md">
              <Card variant="section" padding="sm">
                <Stack gap="xs">
                  <Typography variant="small" color="secondary">
                    Pending
                  </Typography>
                  <Typography variant="label">{pendingCount}</Typography>
                </Stack>
              </Card>
              <Card variant="section" padding="sm">
                <Stack gap="xs">
                  <Typography variant="small" color="secondary">
                    Syncing
                  </Typography>
                  <Typography variant="label">{syncingCount}</Typography>
                </Stack>
              </Card>
              <Card variant="section" padding="sm">
                <Stack gap="xs">
                  <Typography variant="small" color="secondary">
                    Failed
                  </Typography>
                  <Typography variant="label">{failedCount}</Typography>
                </Stack>
              </Card>
            </Grid>
            <QueueItemList
              queue={queue}
              showAll={showAllQueueItems}
              onToggleShowAll={() => setShowAllQueueItems((prev) => !prev)}
              activeMutationId={activeMutationId}
              onRetry={handleRetryMutation}
              onDelete={handleDeleteMutation}
            />
          </Stack>
        </Card>
      )}
    </Flex>
  );
}
