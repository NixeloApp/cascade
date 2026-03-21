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
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { RadioGroup, RadioGroupItem } from "../ui/RadioGroup";
import { Stack } from "../ui/Stack";
import { Switch } from "../ui/Switch";
import { Typography } from "../ui/Typography";
import {
  SettingsIntegrationInset,
  SettingsIntegrationMeta,
  SettingsIntegrationSection,
} from "./SettingsIntegrationSection";

type SyncDirection = "import" | "export" | "bidirectional";

interface GoogleCalendarOAuthData {
  accessToken: string;
  expiresAt: number;
  providerAccountId: string;
  refreshToken: string;
}

function isSyncDirection(value: string): value is SyncDirection {
  return value === "bidirectional" || value === "import" || value === "export";
}

function parseGoogleCalendarOAuthData(value: unknown): GoogleCalendarOAuthData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.providerAccountId !== "string" ||
    typeof candidate.accessToken !== "string" ||
    typeof candidate.refreshToken !== "string" ||
    typeof candidate.expiresAt !== "number"
  ) {
    return null;
  }

  return {
    providerAccountId: candidate.providerAccountId,
    accessToken: candidate.accessToken,
    refreshToken: candidate.refreshToken,
    expiresAt: candidate.expiresAt,
  };
}
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

      const data = parseGoogleCalendarOAuthData(event.data.data);
      if (!data) {
        return;
      }

      setIsConnecting(true);
      try {
        await connectGoogle({
          providerAccountId: data.providerAccountId,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
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

  const handleChangeSyncDirection = async (direction: SyncDirection) => {
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
    <SettingsIntegrationSection
      title="Google Calendar"
      description="Sync meeting and schedule context between Nixelo and Google Calendar."
      icon={Calendar}
      iconTone="brand"
      data-testid={TEST_IDS.SETTINGS.GOOGLE_CALENDAR_INTEGRATION}
      status={
        calendarConnection
          ? { label: "Connected", variant: "success" }
          : { label: "Not Connected", variant: "neutral" }
      }
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
      summary={
        calendarConnection ? (
          <SettingsIntegrationMeta label="Connected account">
            <Stack gap="xs">
              <Typography variant="small">{calendarConnection.providerAccountId}</Typography>
              {calendarConnection.lastSyncAt ? (
                <Typography variant="caption" color="tertiary">
                  Last synced: {new Date(calendarConnection.lastSyncAt).toLocaleString()}
                </Typography>
              ) : null}
            </Stack>
          </SettingsIntegrationMeta>
        ) : (
          <SettingsIntegrationMeta label="Connection status">
            <Typography variant="small" color="secondary">
              Connect Google Calendar before enabling two-way schedule sync.
            </Typography>
          </SettingsIntegrationMeta>
        )
      }
    >
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
        <SettingsIntegrationInset>
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
                  onValueChange={(value) => {
                    if (isSyncDirection(value)) {
                      void handleChangeSyncDirection(value);
                    }
                  }}
                  disabled={isSaving}
                >
                  <Card padding="sm" variant="section" hoverable>
                    <RadioGroupItem
                      value="bidirectional"
                      label="Bidirectional"
                      description="Sync both ways (recommended)"
                    />
                  </Card>
                  <Card padding="sm" variant="section" hoverable>
                    <RadioGroupItem
                      value="import"
                      label="Import Only"
                      description="Only import from Google to Nixelo"
                    />
                  </Card>
                  <Card padding="sm" variant="section" hoverable>
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
        </SettingsIntegrationInset>
      )}
    </SettingsIntegrationSection>
  );
}
