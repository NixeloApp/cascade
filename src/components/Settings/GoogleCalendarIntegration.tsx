/**
 * Google Calendar Integration
 *
 * Settings card for connecting Google Calendar.
 * Handles OAuth flow and sync configuration.
 * Supports bidirectional event synchronization.
 */

import { api } from "@convex/_generated/api";
import { useEffect, useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Calendar } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { RadioGroup, RadioGroupItem } from "../ui/RadioGroup";
import { Stack } from "../ui/Stack";
import { Switch } from "../ui/Switch";
import { Typography } from "../ui/Typography";
/**
 * Google Calendar integration card
 * Extracted from Settings for better organization
 */
export function GoogleCalendarIntegration() {
  const calendarConnection = useAuthenticatedQuery(api.googleCalendar.getConnection, {});
  const { mutate: connectGoogle } = useAuthenticatedMutation(api.googleCalendar.connectGoogle);
  const { mutate: disconnectGoogle } = useAuthenticatedMutation(
    api.googleCalendar.disconnectGoogle,
  );
  const { mutate: updateSyncSettings } = useAuthenticatedMutation(
    api.googleCalendar.updateSyncSettings,
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);

  // Handle OAuth callback message from popup
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      // Validate message origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== "google-calendar-connected") return;

      const { providerAccountId, accessToken, refreshToken, expiresAt } = event.data.data;

      setIsConnecting(true);
      try {
        await connectGoogle({
          providerAccountId,
          accessToken,
          refreshToken,
          expiresAt,
        });
        showSuccess("Google Calendar connected successfully");
      } catch (error) {
        showError(error, "Failed to save Google Calendar connection");
      } finally {
        setIsConnecting(false);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [connectGoogle]);

  const handleDisconnectConfirm = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectGoogle();
      showSuccess("Google Calendar disconnected successfully");
    } catch (error) {
      showError(error, "Failed to disconnect Google Calendar");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnect = () => {
    // Open OAuth flow in popup window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "/google/auth",
      "Google Calendar OAuth",
      `width=${width},height=${height},left=${left},top=${top},popup=yes`,
    );

    if (!popup) {
      showError("Please allow popups to connect to Google Calendar");
      return;
    }
  };

  const handleToggleSync = async () => {
    if (!calendarConnection) return;

    setIsSaving(true);
    try {
      await updateSyncSettings({
        syncEnabled: !calendarConnection.syncEnabled,
      });
      showSuccess(`Sync ${!calendarConnection.syncEnabled ? "enabled" : "disabled"}`);
    } catch (error) {
      showError(error, "Failed to update sync settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeSyncDirection = async (direction: "import" | "export" | "bidirectional") => {
    setIsSaving(true);
    try {
      await updateSyncSettings({
        syncDirection: direction,
      });
      showSuccess("Sync direction updated");
    } catch (error) {
      showError(error, "Failed to update sync direction");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card padding="lg">
      <Stack gap="lg">
        <CardHeader
          action={
            calendarConnection ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDisconnectConfirmOpen(true)}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect Google"}
              </Button>
            )
          }
        >
          <Flex gap="lg" align="center">
            <Card padding="sm" radius="md" variant="section">
              <Icon icon={Calendar} size="lg" color="currentColor" className="text-brand" />
            </Card>
            <Stack gap="xs">
              <Typography variant="h3">Google Calendar</Typography>
              <Typography variant="small" color="secondary">
                Sync calendar events between Nixelo and Google Calendar
              </Typography>
            </Stack>
          </Flex>
        </CardHeader>

        {calendarConnection && (
          <Stack gap="xs">
            <Flex align="center" gap="xs">
              <Badge variant="success">Connected</Badge>
              <Typography variant="small">{calendarConnection.providerAccountId}</Typography>
            </Flex>
            {calendarConnection.lastSyncAt && (
              <Typography variant="caption" color="tertiary">
                Last synced: {new Date(calendarConnection.lastSyncAt).toLocaleString()}
              </Typography>
            )}
          </Stack>
        )}
      </Stack>

      <ConfirmDialog
        isOpen={disconnectConfirmOpen}
        onClose={() => setDisconnectConfirmOpen(false)}
        onConfirm={handleDisconnectConfirm}
        title="Disconnect Google Calendar"
        message="Are you sure you want to disconnect Google Calendar?"
        variant="danger"
        confirmLabel="Disconnect"
      />

      {calendarConnection && (
        <Card padding="md" variant="section" className="mt-6">
          {/* Sync Toggle */}
          <Stack gap="xl">
            <Switch
              label="Enable Sync"
              description="Automatically sync events between Nixelo and Google Calendar"
              labelSide="left"
              checked={calendarConnection.syncEnabled}
              onCheckedChange={handleToggleSync}
              disabled={isSaving}
            />

            {/* Sync Direction */}
            {calendarConnection.syncEnabled && (
              <Stack gap="sm">
                <Typography variant="label">Sync Direction</Typography>
                <RadioGroup
                  value={calendarConnection.syncDirection}
                  onValueChange={(value) =>
                    handleChangeSyncDirection(value as "bidirectional" | "import" | "export")
                  }
                  disabled={isSaving}
                >
                  <Card padding="sm" variant="section">
                    <RadioGroupItem
                      value="bidirectional"
                      label="Bidirectional"
                      description="Sync both ways (recommended)"
                    />
                  </Card>
                  <Card padding="sm" variant="section">
                    <RadioGroupItem
                      value="import"
                      label="Import Only"
                      description="Only import from Google to Nixelo"
                    />
                  </Card>
                  <Card padding="sm" variant="section">
                    <RadioGroupItem
                      value="export"
                      label="Export Only"
                      description="Only export from Nixelo to Google"
                    />
                  </Card>
                </RadioGroup>
              </Stack>
            )}
          </Stack>
        </Card>
      )}
    </Card>
  );
}
