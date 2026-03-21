/**
 * Settings
 *
 * Main settings page with tabbed navigation.
 * Includes profile, security, notifications, and admin tabs.
 * Role-based visibility controls admin-only sections.
 */

import { api } from "@convex/_generated/api";
import type { ComponentType } from "react";
import { useEffect } from "react";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { PageControls, PageStack } from "./layout";
import { AdminTab } from "./Settings/AdminTab";
import { ApiKeysManager } from "./Settings/ApiKeysManager";
import { DevToolsTab } from "./Settings/DevToolsTab";
import { GitHubIntegration } from "./Settings/GitHubIntegration";
import { GoogleCalendarIntegration } from "./Settings/GoogleCalendarIntegration";
import { NotificationsTab } from "./Settings/NotificationsTab";
import { OfflineTab } from "./Settings/OfflineTab";
import { PreferencesTab } from "./Settings/PreferencesTab";
import { ProfileTab } from "./Settings/ProfileTab";
import { PumbleIntegration } from "./Settings/PumbleIntegration";
import { SlackIntegration } from "./Settings/SlackIntegration";
import {
  getVisibleSettingsTabs,
  isSettingsTabValue,
  resolveSettingsTab,
  type SettingsTabValue,
} from "./Settings/settingsTabs";
import { TwoFactorSettings } from "./Settings/TwoFactorSettings";
import { Stack } from "./ui/Stack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs";

const isTestEmail = (email?: string) => email?.endsWith("@inbox.mailtrap.io") ?? false;
const isScreenshotSeedEmail = (email?: string) => email?.includes("-screenshots@") ?? false;
const INTEGRATION_SECTIONS = [
  { key: "github", Component: GitHubIntegration },
  { key: "slack", Component: SlackIntegration },
  { key: "google-calendar", Component: GoogleCalendarIntegration },
  { key: "pumble", Component: PumbleIntegration },
] as const;

const SETTINGS_TAB_CONTENT = {
  profile: ProfileTab,
  security: TwoFactorSettings,
  notifications: NotificationsTab,
  integrations: IntegrationsTab,
  apikeys: ApiKeysManager,
  offline: OfflineTab,
  preferences: PreferencesTab,
  admin: AdminTab,
  developer: DevToolsTab,
} satisfies Record<SettingsTabValue, ComponentType>;

interface SettingsProps {
  activeTab: SettingsTabValue;
  onTabChange: (tab: SettingsTabValue) => void;
}

/** Main settings page with tabs for profile, preferences, integrations, and admin. */
export function Settings({ activeTab: requestedTab, onTabChange }: SettingsProps) {
  const currentUser = useAuthenticatedQuery(api.users.getCurrent, {});
  const isAdmin = useAuthenticatedQuery(api.users.isOrganizationAdmin, {});
  const showDevTools =
    isTestEmail(currentUser?.email) && !isScreenshotSeedEmail(currentUser?.email);
  const visibleTabs = getVisibleSettingsTabs({
    isAdmin: isAdmin === true,
    showDevTools,
  });
  const activeTab = resolveSettingsTab(requestedTab, visibleTabs);
  const canCanonicalizeRequestedTab =
    (requestedTab !== "admin" || isAdmin !== undefined) &&
    (requestedTab !== "developer" || currentUser !== undefined);

  useEffect(() => {
    if (canCanonicalizeRequestedTab && activeTab !== requestedTab) {
      onTabChange(activeTab);
    }
  }, [activeTab, canCanonicalizeRequestedTab, onTabChange, requestedTab]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (isSettingsTabValue(value)) {
          onTabChange(value);
        }
      }}
      className="w-full"
    >
      <PageStack>
        <PageControls padding="sm" gap="sm" spacing="stack">
          <TabsList size="compact" layout="settings" aria-label="Settings sections">
            {visibleTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} size="compact" width="responsive">
                <span className="lg:hidden">{tab.shortLabel ?? tab.label}</span>
                <span className="hidden lg:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </PageControls>

        {visibleTabs.map((tab) => {
          const Content = SETTINGS_TAB_CONTENT[tab.value];

          return (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              <Content />
            </TabsContent>
          );
        })}
      </PageStack>
    </Tabs>
  );
}

function IntegrationsTab() {
  return (
    <Stack gap="lg">
      {INTEGRATION_SECTIONS.map(({ key, Component }) => (
        <Component key={key} />
      ))}
    </Stack>
  );
}
