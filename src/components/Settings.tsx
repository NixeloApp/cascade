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
import { HourComplianceDashboard } from "./Admin/HourComplianceDashboard";
import { IpRestrictionsSettings } from "./Admin/IpRestrictionsSettings";
import { OAuthFeatureFlagSettings } from "./Admin/OAuthFeatureFlagSettings";
import { OAuthHealthDashboard } from "./Admin/OAuthHealthDashboard";
import { OrganizationSettings } from "./Admin/OrganizationSettings";
import { UserManagement } from "./Admin/UserManagement";
import { UserTypeManager } from "./Admin/UserTypeManager";
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
const INTEGRATION_SECTIONS = [
  { key: "github", Component: GitHubIntegration },
  { key: "slack", Component: SlackIntegration },
  { key: "google-calendar", Component: GoogleCalendarIntegration },
  { key: "pumble", Component: PumbleIntegration },
] as const;
const ADMIN_SECTIONS = [
  { key: "organization", Component: OrganizationSettings },
  { key: "oauth-health", Component: OAuthHealthDashboard },
  { key: "oauth-flags", Component: OAuthFeatureFlagSettings },
  { key: "ip-restrictions", Component: IpRestrictionsSettings },
  { key: "user-management", Component: UserManagement },
  { key: "user-types", Component: UserTypeManager },
  { key: "hour-compliance", Component: HourComplianceDashboard },
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
  const showDevTools = isTestEmail(currentUser?.email);
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
      <TabsList size="compact" layout="settings">
        {visibleTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} size="compact" width="responsive">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {visibleTabs.map((tab) => {
        const Content = SETTINGS_TAB_CONTENT[tab.value];

        return (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            <Content />
          </TabsContent>
        );
      })}
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

function AdminTab() {
  return (
    <Stack gap="xl">
      {ADMIN_SECTIONS.map(({ key, Component }) => (
        <Component key={key} />
      ))}
    </Stack>
  );
}
