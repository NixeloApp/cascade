import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Button } from "../ui/Button";
import { Dialog, DialogTrigger } from "../ui/Dialog";
import { Label } from "../ui/Label";
import { Switch } from "../ui/Switch";
import { Typography } from "../ui/Typography";

export function DashboardCustomizeModal() {
  const userSettings = useQuery(api.userSettings.get);
  const updateSettings = useMutation(api.userSettings.update);
  const [open, setOpen] = useState(false);

  // Defaults
  const [preferences, setPreferences] = useState({
    showStats: true,
    showRecentActivity: true,
    showWorkspaces: true,
  });

  // Sync with DB
  useEffect(() => {
    if (userSettings?.dashboardLayout) {
      setPreferences((prev) => ({ ...prev, ...userSettings.dashboardLayout }));
    }
  }, [userSettings]);

  const handleToggle = (key: keyof typeof preferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    updateSettings({
      dashboardLayout: newPrefs,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Dashboard Customization"
      description="Choose which widgets to display on your personal dashboard."
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Flex align="center" gap="xs">
            <Settings2 className="w-4 h-4" />
            Customize
          </Flex>
        </Button>
      </DialogTrigger>

      <Stack gap="md">
        <Flex align="center" justify="between" gap="sm">
          <Label htmlFor="show-stats">
            <Stack gap="none">
              <span>Quick Stats</span>
              <Typography variant="caption" color="secondary" as="span">
                Show issue and project counts
              </Typography>
            </Stack>
          </Label>
          <Switch
            id="show-stats"
            checked={preferences.showStats}
            onCheckedChange={() => handleToggle("showStats")}
          />
        </Flex>

        <Flex align="center" justify="between" gap="sm">
          <Label htmlFor="show-activity">
            <Stack gap="none">
              <span>Recent Activity</span>
              <Typography variant="caption" color="secondary" as="span">
                Show your latest actions and history
              </Typography>
            </Stack>
          </Label>
          <Switch
            id="show-activity"
            checked={preferences.showRecentActivity}
            onCheckedChange={() => handleToggle("showRecentActivity")}
          />
        </Flex>

        <Flex align="center" justify="between" gap="sm">
          <Label htmlFor="show-workspaces">
            <Stack gap="none">
              <span>My Workspaces</span>
              <Typography variant="caption" color="secondary" as="span">
                Show list of projects you belong to
              </Typography>
            </Stack>
          </Label>
          <Switch
            id="show-workspaces"
            checked={preferences.showWorkspaces}
            onCheckedChange={() => handleToggle("showWorkspaces")}
          />
        </Flex>
      </Stack>
    </Dialog>
  );
}
