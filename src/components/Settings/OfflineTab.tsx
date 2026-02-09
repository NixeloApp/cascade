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
      <Card>
        <div className="p-6">
          <Flex gap="lg" align="center">
            <div
              className={cn("p-3 rounded-lg", isOnline ? "bg-status-success" : "bg-status-error")}
            >
              {isOnline ? (
                <Wifi className="h-6 w-6 text-brand-foreground" />
              ) : (
                <WifiOff className="h-6 w-6 text-brand-foreground" />
              )}
            </div>
            <div>
              <Typography variant="h3" className="text-lg font-semibold text-ui-text">
                Connection Status
              </Typography>
              <Typography
                className={cn(
                  "text-sm mt-1",
                  isOnline ? "text-status-success" : "text-status-error",
                )}
              >
                <Flex align="center" gap="xs">
                  {isOnline ? <Icon icon={Check} size="sm" /> : <Icon icon={X} size="sm" />}
                  {isOnline ? "You are online" : "You are offline"}
                </Flex>
              </Typography>
            </div>
          </Flex>

          <div className="mt-6 pt-6 border-t border-ui-border">
            <Grid cols={1} colsSm={3} gap="lg">
              <div className="p-4 bg-ui-bg-secondary rounded-lg">
                <Typography className="text-sm text-ui-text-secondary">Pending Changes</Typography>
                <Typography className="text-2xl font-bold text-ui-text mt-1">
                  {isLoading ? "..." : count}
                </Typography>
              </div>
              <div className="p-4 bg-ui-bg-secondary rounded-lg">
                <Typography className="text-sm text-ui-text-secondary">Sync Status</Typography>
                <Typography className="text-2xl font-bold text-ui-text mt-1">
                  {isOnline ? "Ready" : "Paused"}
                </Typography>
              </div>
              <div className="p-4 bg-ui-bg-secondary rounded-lg">
                <Typography className="text-sm text-ui-text-secondary">Storage</Typography>
                <Typography className="text-2xl font-bold text-ui-text mt-1">IndexedDB</Typography>
              </div>
            </Grid>
          </div>
        </div>
      </Card>

      {/* Offline Features */}
      <Card>
        <div className="p-6">
          <Typography variant="h3" className="text-lg font-semibold text-ui-text mb-4">
            Offline Features
          </Typography>
          <Flex direction="column" gap="lg">
            <Flex gap="md" align="start">
              <Icon icon={Check} size="sm" className="mt-0.5 text-status-success" />
              <div>
                <Typography className="text-sm font-medium text-ui-text">
                  View Cached Content
                </Typography>
                <Typography className="text-sm text-ui-text-secondary">
                  Access recently viewed projects and issues while offline
                </Typography>
              </div>
            </Flex>
            <Flex gap="md" align="start">
              <Icon icon={Check} size="sm" className="mt-0.5 text-status-success" />
              <div>
                <Typography className="text-sm font-medium text-ui-text">Offline Edits</Typography>
                <Typography className="text-sm text-ui-text-secondary">
                  Make changes offline - they'll sync automatically when you're back online
                </Typography>
              </div>
            </Flex>
            <Flex gap="md" align="start">
              <Icon icon={Check} size="sm" className="mt-0.5 text-status-success" />
              <div>
                <Typography className="text-sm font-medium text-ui-text">
                  Background Sync
                </Typography>
                <Typography className="text-sm text-ui-text-secondary">
                  Changes sync automatically in the background when connection is restored
                </Typography>
              </div>
            </Flex>
            <Flex gap="md" align="start">
              <Icon icon={Check} size="sm" className="mt-0.5 text-status-success" />
              <div>
                <Typography className="text-sm font-medium text-ui-text">Install as App</Typography>
                <Typography className="text-sm text-ui-text-secondary">
                  Install Nixelo as a standalone app on your device
                </Typography>
              </div>
            </Flex>
          </Flex>
        </div>
      </Card>

      {/* Sync Queue */}
      {count > 0 && (
        <Card>
          <div className="p-6">
            <Flex justify="between" align="center" className="mb-4">
              <Typography variant="h3" className="text-lg font-semibold text-ui-text">
                Pending Sync Queue
              </Typography>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.info("Manual sync triggered")}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            </Flex>
            <Flex direction="column" gap="sm">
              {pending.slice(0, 5).map((item) => (
                <Flex
                  key={item.id}
                  justify="between"
                  align="center"
                  className="p-3 bg-ui-bg-secondary rounded-lg"
                >
                  <div>
                    <Typography className="text-sm font-medium text-ui-text">
                      {item.mutationType}
                    </Typography>
                    <Typography className="text-xs text-ui-text-tertiary">
                      {new Date(item.timestamp).toLocaleString()}
                    </Typography>
                  </div>
                  <Badge variant="warning" size="md">
                    Pending
                  </Badge>
                </Flex>
              ))}
              {pending.length > 5 && (
                <Typography className="text-sm text-ui-text-tertiary text-center pt-2">
                  +{pending.length - 5} more items
                </Typography>
              )}
            </Flex>
          </div>
        </Card>
      )}
    </Flex>
  );
}
