/**
 * Offline Settings Tab
 *
 * Displays connection status and offline sync information.
 * Shows pending changes queue and sync controls.
 * Lists available offline features and capabilities.
 */

import { Check, RefreshCw, Wifi, WifiOff, X } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showInfo } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useOfflineSyncStatus, useOnlineStatus } from "../../hooks/useOffline";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

/**
 * Offline mode settings tab
 * Extracted from Settings for better organization
 */
export function OfflineTab() {
  const isOnline = useOnlineStatus();
  const { pending, count, isLoading, refresh } = useOfflineSyncStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasServiceWorkerSupport =
    typeof navigator !== "undefined" && "serviceWorker" in navigator;
  const hasBackgroundSyncSupport =
    typeof ServiceWorkerRegistration !== "undefined" &&
    hasServiceWorkerSupport &&
    "sync" in ServiceWorkerRegistration.prototype;

  const handleRefreshQueue = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      showInfo("Local offline queue refreshed");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Flex direction="column" gap="xl">
      {/* Connection Status */}
      <Card padding="lg" data-testid={TEST_IDS.SETTINGS.OFFLINE_STATUS_CARD}>
        <Stack gap="lg">
          <Flex gap="lg" align="center">
            <div className={cn("p-2", isOnline ? "bg-status-success" : "bg-status-error")}>
              {isOnline ? (
                <Wifi className="h-6 w-6 text-brand-foreground" />
              ) : (
                <WifiOff className="h-6 w-6 text-brand-foreground" />
              )}
            </div>
            <Stack gap="xs">
              <Typography variant="h3">Connection Status</Typography>
              <Typography
                variant="small"
                as="span"
                className={isOnline ? "text-status-success" : "text-status-error"}
              >
                <Flex as="span" align="center" gap="xs">
                  {isOnline ? <Icon icon={Check} size="sm" /> : <Icon icon={X} size="sm" />}
                  {isOnline ? "You are online" : "You are offline"}
                </Flex>
              </Typography>
            </Stack>
          </Flex>

          <div className="pt-6 border-t border-ui-border">
            <Grid cols={1} colsSm={3} gap="lg">
              <div className="p-4 bg-ui-bg-secondary">
                <Stack gap="xs">
                  <Typography variant="small" color="secondary">
                    Pending Changes
                  </Typography>
                  <Typography variant="h2">{isLoading ? "..." : count}</Typography>
                </Stack>
              </div>
              <div className="p-4 bg-ui-bg-secondary">
                <Stack gap="xs">
                  <Typography variant="small" color="secondary">
                    Sync Status
                  </Typography>
                  <Typography variant="h2">{isOnline ? "Local only" : "Offline"}</Typography>
                </Stack>
              </div>
              <div className="p-4 bg-ui-bg-secondary">
                <Stack gap="xs">
                  <Typography variant="small" color="secondary">
                    Storage
                  </Typography>
                  <Typography variant="h2">IndexedDB</Typography>
                </Stack>
              </div>
            </Grid>
          </div>
        </Stack>
      </Card>

      <Card padding="lg">
        <Stack gap="sm">
          <Typography variant="h3">Offline Status</Typography>
          <Typography variant="small" color="secondary">
            This screen currently reports the local IndexedDB queue and browser connectivity only.
            End-to-end replay, install prompts, and service-worker ownership are still under audit.
          </Typography>
          <Grid cols={1} colsSm={2} gap="md">
            <div className="p-4 bg-ui-bg-secondary">
              <Stack gap="xs">
                <Typography variant="small" color="secondary">
                  Service Worker Support
                </Typography>
                <Typography variant="label">
                  {hasServiceWorkerSupport ? "Detected" : "Unavailable"}
                </Typography>
              </Stack>
            </div>
            <div className="p-4 bg-ui-bg-secondary">
              <Stack gap="xs">
                <Typography variant="small" color="secondary">
                  Background Sync Support
                </Typography>
                <Typography variant="label">
                  {hasBackgroundSyncSupport ? "Detected" : "Unavailable"}
                </Typography>
              </Stack>
            </div>
          </Grid>
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
                  The shipped service worker includes an offline fallback page for navigation failures.
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
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Queue
              </Button>
            </Flex>
            <Stack gap="sm">
              {pending.slice(0, 5).map((item) => (
                <div key={item.id} className="p-2 bg-ui-bg-secondary">
                  <Flex justify="between" align="center">
                    <Stack gap="none">
                      <Typography variant="label">{item.mutationType}</Typography>
                      <Typography variant="caption">
                        {new Date(item.timestamp).toLocaleString()}
                      </Typography>
                    </Stack>
                    <Badge variant="warning" size="md">
                      Pending
                    </Badge>
                  </Flex>
                </div>
              ))}
              {pending.length > 5 && (
                <Typography variant="small" color="tertiary" className="text-center pt-2">
                  +{pending.length - 5} more items
                </Typography>
              )}
            </Stack>
          </Stack>
        </Card>
      )}
    </Flex>
  );
}
