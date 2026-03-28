/**
 * Preferences Tab
 *
 * User preferences settings for theme and regional options.
 * Handles theme switching, timezone selection, and notifications.
 * Persists settings to database with real-time sync.
 */

import { api } from "@convex/_generated/api";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOfflineUserSettingsUpdate } from "@/hooks/useOfflineUserSettingsUpdate";
import { Monitor, Moon, Sun } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { useTheme } from "../../contexts/ThemeContext";
import { Flex } from "../ui/Flex";
import { SegmentedControl, SegmentedControlItem } from "../ui/SegmentedControl";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { SettingsSection, SettingsSectionRow } from "./SettingsSection";
/**
 * User preferences tab
 * Handles Theme, Timezone, and Browser Notifications (UI Settings)
 */
export function PreferencesTab() {
  const { theme, setTheme } = useTheme();

  // Settings from DB
  const userSettings = useAuthenticatedQuery(api.userSettings.get, {});
  const { update: updateSettings } = useOfflineUserSettingsUpdate();

  // Local state for timezone (defaults to system if not set)
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  useEffect(() => {
    if (userSettings?.timezone) {
      setSelectedTimezone(userSettings.timezone);
    }
    // Also sync theme from DB if different from local?
    // Usually theme context handles local storage, but we can respect DB as source of truth on load.
    if (userSettings?.theme && userSettings.theme !== theme) {
      // We won't force it here to avoid flickering loop, assuming user action drives it.
    }
  }, [userSettings, theme]);

  const handleThemeChange = async (value: "light" | "dark" | "system") => {
    const previousTheme = theme;
    setTheme(value); // Update local context optimistically
    try {
      await updateSettings(
        { theme: value },
        { queuedMessage: "Theme preference saved for sync when you are back online" },
      );
    } catch (error) {
      setTheme(previousTheme); // Rollback on failure
      showError(error, "Failed to update theme");
    }
  };

  const handleTimezoneChange = async (value: string) => {
    const previousTimezone = selectedTimezone;
    setSelectedTimezone(value);
    try {
      const result = await updateSettings(
        { timezone: value },
        { queuedMessage: "Timezone change queued for sync when you are back online" },
      );
      // Only show success when not queued — the hook already showed the queued message
      if (!result.queued) {
        showSuccess("Timezone updated");
      }
    } catch (error) {
      setSelectedTimezone(previousTimezone);
      showError(error, "Failed to update timezone");
    }
  };

  const handleDesktopNotificationsChange = async (enabled: boolean) => {
    // In a real app, this would request browser permissions
    if (enabled && "Notification" in window && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showError("Browser notifications blocked");
        return;
      }
    }

    try {
      await updateSettings({ desktopNotifications: enabled }, { allowOfflineQueue: false });
      showSuccess(`Desktop notifications ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      showError(error, "Failed to update desktop notification setting");
    }
  };

  // Common timezones list (simplified)
  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  return (
    <Stack gap="lg">
      <SettingsSection
        title="Appearance"
        description="Keep visual preferences in one predictable place across devices."
      >
        <SettingsSectionRow
          title="Theme"
          description="Choose the interface tone you want Nixelo to use by default."
          action={
            <SegmentedControl
              value={theme}
              layout="stackOnMobile"
              iconSpacing
              onValueChange={(value: string) => {
                if (value) {
                  void handleThemeChange(value as "light" | "dark" | "system");
                }
              }}
            >
              <SegmentedControlItem value="light" aria-label="Light theme">
                <Icon icon={Sun} size="sm" />
                Light
              </SegmentedControlItem>
              <SegmentedControlItem value="dark" aria-label="Dark theme">
                <Icon icon={Moon} size="sm" />
                Dark
              </SegmentedControlItem>
              <SegmentedControlItem value="system" aria-label="System theme">
                <Icon icon={Monitor} size="sm" />
                System
              </SegmentedControlItem>
            </SegmentedControl>
          }
        />
      </SettingsSection>

      <SettingsSection
        title="Regional"
        description="Control how timestamps and local workspace context are presented."
      >
        <SettingsSectionRow
          title="Timezone"
          description="Use a specific timezone for issue, meeting, and audit timestamps."
          action={
            <Select
              className="w-full sm:w-60"
              id="timezone"
              onChange={(value) => void handleTimezoneChange(value)}
              options={timezones.map((timezone) => ({ value: timezone, label: timezone }))}
              placeholder="Select timezone"
              value={selectedTimezone}
            />
          }
        />
      </SettingsSection>

      <SettingsSection
        title="Desktop Notifications"
        description="Keep browser-level alerts aligned with the richer notification settings tab."
      >
        <SettingsSectionRow
          title="Browser Push Notifications"
          description="Allow pop-up notifications while Nixelo is open in this browser."
          action={
            <Flex align="center">
              <Switch
                id="desktop-notifs"
                checked={userSettings?.desktopNotifications ?? false}
                onCheckedChange={(checked) => void handleDesktopNotificationsChange(checked)}
              />
            </Flex>
          }
        />
      </SettingsSection>
    </Stack>
  );
}
