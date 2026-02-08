import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Monitor, Moon, Sun } from "@/lib/icons";
import { useTheme } from "../../contexts/ThemeContext";
import { Card } from "../ui/Card";
import { Label } from "../ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { ToggleGroup, ToggleGroupItem } from "../ui/ToggleGroup";
import { Typography } from "../ui/Typography";

/**
 * User preferences tab
 * Handles Theme, Timezone, and Browser Notifications (UI Settings)
 */
export function PreferencesTab() {
  const { theme, setTheme } = useTheme();

  // Settings from DB
  const userSettings = useQuery(api.userSettings.get);
  const updateSettings = useMutation(api.userSettings.update);

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
    setTheme(value); // Update local context
    await updateSettings({ theme: value }); // Persist to DB
  };

  const handleTimezoneChange = async (value: string) => {
    setSelectedTimezone(value);
    try {
      await updateSettings({ timezone: value });
      toast.success("Timezone updated");
    } catch (_error) {
      toast.error("Failed to update timezone");
    }
  };

  const handleDesktopNotificationsChange = async (enabled: boolean) => {
    // In a real app, this would request browser permissions
    if (enabled && "Notification" in window && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Browser notifications blocked");
        return;
      }
    }

    await updateSettings({ desktopNotifications: enabled });
    toast.success(`Desktop notifications ${enabled ? "enabled" : "disabled"}`);
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
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <Typography variant="h3" className="text-lg font-semibold text-ui-text mb-4">
            Appearance
          </Typography>

          <Flex direction="column" gap="lg">
            <Flex align="center" justify="between">
              <div>
                <Typography className="text-sm font-medium text-ui-text">Theme</Typography>
                <Typography className="text-sm text-ui-text-secondary">
                  Select your preferred interface theme
                </Typography>
              </div>

              <ToggleGroup
                type="single"
                value={theme}
                onValueChange={(value) => {
                  if (value) handleThemeChange(value as "light" | "dark" | "system");
                }}
                variant="default"
                size="md"
              >
                <ToggleGroupItem value="light" aria-label="Light theme">
                  <Icon icon={Sun} size="sm" className="mr-2" /> Light
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label="Dark theme">
                  <Icon icon={Moon} size="sm" className="mr-2" /> Dark
                </ToggleGroupItem>
                <ToggleGroupItem value="system" aria-label="System theme">
                  <Icon icon={Monitor} size="sm" className="mr-2" /> System
                </ToggleGroupItem>
              </ToggleGroup>
            </Flex>
          </Flex>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <Typography variant="h3" className="text-lg font-semibold text-ui-text mb-4">
            Regional
          </Typography>
          <Flex align="center" justify="between">
            <div>
              <Label htmlFor="timezone" className="text-base">
                Timezone
              </Label>
              <Typography className="text-sm text-ui-text-secondary mt-1">
                Your timestamp display preference
              </Typography>
            </div>
            <div className="w-60">
              <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Flex>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <Typography variant="h3" className="text-lg font-semibold text-ui-text mb-4">
            Desktop Notifications
          </Typography>
          <Flex align="center" justify="between">
            <div>
              <Label htmlFor="desktop-notifs" className="text-base">
                Browser Push Notifications
              </Label>
              <Typography className="text-sm text-ui-text-secondary mt-1">
                Receive pop-up notifications when you are active
              </Typography>
            </div>
            <Switch
              id="desktop-notifs"
              checked={userSettings?.desktopNotifications ?? false}
              onCheckedChange={handleDesktopNotificationsChange}
            />
          </Flex>
        </div>
      </Card>
    </div>
  );
}
