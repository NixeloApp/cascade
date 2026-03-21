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
import { useOfflineSyncStatus, useOnlineStatus } from "../../hooks/useOffline";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { SettingsSection, SettingsSectionRow } from "./SettingsSection";

/**
 * Offline mode settings tab
 * Extracted from Settings for better organization
 */
export function OfflineTab() {
  const isOnline = useOnlineStatus();
  const { pending, count, isLoading } = useOfflineSyncStatus();
  const statusLabel = isOnline ? "Online" : "Offline";
  const syncStatus = isOnline ? "Ready" : "Paused";

  return (
    <Stack gap="lg">
      <SettingsSection
        title="Connection Status"
        description="See whether local changes can sync immediately and how much work is waiting on the device."
        icon={isOnline ? Wifi : WifiOff}
        iconTone={isOnline ? "success" : "error"}
        titleAdornment={
          <Badge variant={isOnline ? "success" : "error"} size="sm">
            {statusLabel}
          </Badge>
        }
        data-testid={TEST_IDS.SETTINGS.OFFLINE_STATUS_CARD}
      >
        <SettingsSectionRow
          title="Current status"
          description={isOnline ? "You are online" : "You are offline"}
          action={
            <Flex gap="xs" align="center">
              <Icon icon={isOnline ? Check : X} size="sm" tone={isOnline ? "success" : "error"} />
              <Typography variant="small" color={isOnline ? "success" : "error"}>
                {isOnline
                  ? "Changes will sync immediately"
                  : "Changes will resume syncing when you reconnect"}
              </Typography>
            </Flex>
          }
        />

        <Grid cols={1} colsSm={3} gap="md">
          <Card variant="section" padding="md">
            <Stack gap="xs">
              <Typography variant="small" color="secondary">
                Pending Changes
              </Typography>
              <Typography variant="h2">{isLoading ? "..." : count}</Typography>
            </Stack>
          </Card>
          <Card variant="section" padding="md">
            <Stack gap="xs">
              <Typography variant="small" color="secondary">
                Sync Status
              </Typography>
              <Typography variant="h2">{syncStatus}</Typography>
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
      </SettingsSection>

      <SettingsSection
        title="Offline Features"
        description="These workflows stay usable when a connection drops and reconcile once sync is available again."
      >
        <Stack gap="sm">
          {[
            {
              description: "Access recently viewed projects and issues while offline",
              title: "View Cached Content",
            },
            {
              description:
                "Make changes offline and sync them automatically when you are back online",
              title: "Offline Edits",
            },
            {
              description: "Resume syncing in the background as soon as connectivity is restored",
              title: "Background Sync",
            },
            {
              description: "Install Nixelo as a standalone app on your device",
              title: "Install as App",
            },
          ].map((feature) => (
            <Card key={feature.title} variant="section" padding="sm">
              <Flex gap="md" align="start">
                <Icon icon={Check} size="sm" tone="success" />
                <FlexItem flex="1">
                  <Stack gap="xs">
                    <Typography variant="label">{feature.title}</Typography>
                    <Typography variant="small" color="secondary">
                      {feature.description}
                    </Typography>
                  </Stack>
                </FlexItem>
              </Flex>
            </Card>
          ))}
        </Stack>
      </SettingsSection>

      {count > 0 ? (
        <SettingsSection
          title="Pending Sync Queue"
          description="Review the most recent offline mutations waiting to be pushed upstream."
          action={
            <Button variant="secondary" size="sm" onClick={() => showInfo("Manual sync triggered")}>
              <Icon icon={RefreshCw} size="sm" />
              Sync Now
            </Button>
          }
        >
          <Stack gap="sm">
            {pending.slice(0, 5).map((item) => (
              <Card key={item.id} variant="section" padding="sm">
                <Flex
                  direction="column"
                  gap="sm"
                  directionSm="row"
                  alignSm="center"
                  className="sm:justify-between"
                >
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
            {pending.length > 5 ? (
              <Typography variant="small" color="tertiary" className="text-center">
                +{pending.length - 5} more items
              </Typography>
            ) : null}
          </Stack>
        </SettingsSection>
      ) : null}
    </Stack>
  );
}
