import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Calendar, Check } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
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
  const calendarConnection = useQuery(api.googleCalendar.getConnection);
  const connectGoogle = useMutation(api.googleCalendar.connectGoogle);
  const disconnectGoogle = useMutation(api.googleCalendar.disconnectGoogle);
  const updateSyncSettings = useMutation(api.googleCalendar.updateSyncSettings);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle OAuth callback message from popup
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
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

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Calendar?")) {
      return;
    }

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
      <Flex justify="between" align="start">
        <Flex gap="lg" align="center">
          <div className="p-3 bg-brand-ring rounded-lg">
            <Calendar className="h-6 w-6 text-brand-foreground" />
          </div>
          <Stack gap="xs">
            <Typography variant="h3">Google Calendar</Typography>
            <Typography variant="small" color="secondary">
              Sync calendar events between Nixelo and Google Calendar
            </Typography>
            {calendarConnection && (
              <Stack gap="xs">
                <Flex align="center" gap="xs" className="text-status-success">
                  <Icon icon={Check} size="sm" />
                  <Typography variant="small">
                    Connected to {calendarConnection.providerAccountId}
                  </Typography>
                </Flex>
                {calendarConnection.lastSyncAt && (
                  <Typography variant="caption" color="tertiary">
                    Last synced: {new Date(calendarConnection.lastSyncAt).toLocaleString()}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        </Flex>
        {calendarConnection ? (
          <Button variant="danger" size="sm" onClick={handleDisconnect} disabled={isDisconnecting}>
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect Google"}
          </Button>
        )}
      </Flex>

      {calendarConnection && (
        <Stack gap="xl" className="mt-6 pt-6 border-t border-ui-border">
          {/* Sync Toggle */}
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
                <Card
                  padding="sm"
                  className="bg-ui-bg-secondary hover:bg-ui-bg-tertiary cursor-pointer"
                >
                  <RadioGroupItem
                    value="bidirectional"
                    label="Bidirectional"
                    description="Sync both ways (recommended)"
                  />
                </Card>
                <Card
                  padding="sm"
                  className="bg-ui-bg-secondary hover:bg-ui-bg-tertiary cursor-pointer"
                >
                  <RadioGroupItem
                    value="import"
                    label="Import Only"
                    description="Only import from Google to Nixelo"
                  />
                </Card>
                <Card
                  padding="sm"
                  className="bg-ui-bg-secondary hover:bg-ui-bg-tertiary cursor-pointer"
                >
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
      )}
    </Card>
  );
}
