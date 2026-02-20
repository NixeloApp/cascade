import { toast } from "sonner";
import { Check, RefreshCw, Wifi, WifiOff, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
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
  const { pending, count, isLoading } = useOfflineSyncStatus();

  return (
    <Flex direction="column" gap="xl">
      {/* Connection Status */}
      <Card padding="lg">
        <Stack gap="lg">
          <Flex gap="lg" align="center">
            <Card
              padding="sm"
              radius="md"
              variant="ghost"
              className={cn(isOnline ? "bg-status-success" : "bg-status-error")}
            >
              {isOnline ? (
                <Wifi className="h-6 w-6 text-brand-foreground" />
              ) : (
                <WifiOff className="h-6 w-6 text-brand-foreground" />
              )}
            </Card>
            <Stack gap="xs">
              <Typography variant="h3">Connection Status</Typography>
              <Typography
                variant="small"
                className={isOnline ? "text-status-success" : "text-status-error"}
              >
                <Flex align="center" gap="xs">
                  {isOnline ? <Icon icon={Check} size="sm" /> : <Icon icon={X} size="sm" />}
                  {isOnline ? "You are online" : "You are offline"}
                </Flex>
              </Typography>
            </Stack>
          </Flex>

          <div className="pt-6 border-t border-ui-border">
            <Grid cols={1} colsSm={3} gap="lg">
              <Card padding="md" className="bg-ui-bg-secondary">
                <Stack gap="xs">
                  <Typography variant="small" color="secondary">
                    Pending Changes
                  </Typography>
                  <Typography variant="h2">{isLoading ? "..." : count}</Typography>
                </Stack>
              </Card>
              <Card padding="md" className="bg-ui-bg-secondary">
                <Stack gap="xs">
                  <Typography variant="small" color="secondary">
                    Sync Status
                  </Typography>
                  <Typography variant="h2">{isOnline ? "Ready" : "Paused"}</Typography>
                </Stack>
              </Card>
              <Card padding="md" className="bg-ui-bg-secondary">
                <Stack gap="xs">
                  <Typography variant="small" color="secondary">
                    Storage
                  </Typography>
                  <Typography variant="h2">IndexedDB</Typography>
                </Stack>
              </Card>
            </Grid>
          </div>
        </Stack>
      </Card>

      {/* Offline Features */}
      <Card padding="lg">
        <Stack gap="lg">
          <Typography variant="h3">Offline Features</Typography>
          <Stack gap="lg">
            <Flex gap="md" align="start">
              <Icon icon={Check} size="sm" className="mt-0.5 text-status-success" />
              <Stack gap="xs">
                <Typography variant="label">View Cached Content</Typography>
                <Typography variant="small" color="secondary">
                  Access recently viewed projects and issues while offline
                </Typography>
              </Stack>
            </Flex>
            <Flex gap="md" align="start">
              <Icon icon={Check} size="sm" className="mt-0.5 text-status-success" />
              <Stack gap="xs">
                <Typography variant="label">Offline Edits</Typography>
                <Typography variant="small" color="secondary">
                  Make changes offline - they'll sync automatically when you're back online
                </Typography>
              </Stack>
            </Flex>
            <Flex gap="md" align="start">
              <Icon icon={Check} size="sm" className="mt-0.5 text-status-success" />
              <Stack gap="xs">
                <Typography variant="label">Background Sync</Typography>
                <Typography variant="small" color="secondary">
                  Changes sync automatically in the background when connection is restored
                </Typography>
              </Stack>
            </Flex>
            <Flex gap="md" align="start">
              <Icon icon={Check} size="sm" className="mt-0.5 text-status-success" />
              <Stack gap="xs">
                <Typography variant="label">Install as App</Typography>
                <Typography variant="small" color="secondary">
                  Install Nixelo as a standalone app on your device
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
              <Typography variant="h3">Pending Sync Queue</Typography>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.info("Manual sync triggered")}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            </Flex>
            <Stack gap="sm">
              {pending.slice(0, 5).map((item) => (
                <Card key={item.id} padding="sm" className="bg-ui-bg-secondary">
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
                </Card>
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
