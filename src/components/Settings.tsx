import { api } from "@convex/_generated/api";
import { useSearch } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { HourComplianceDashboard } from "./Admin/HourComplianceDashboard";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/ShadcnTabs";
import { Typography } from "./ui/Typography";

const isTestEmail = (email?: string) => email?.endsWith("@inbox.mailtrap.io") ?? false;

const validTabs = [
  "integrations",
  "apikeys",
  "offline",
  "preferences",
  "admin",
  "developer",
] as const;
type TabValue = (typeof validTabs)[number];

export function Settings() {
  const currentUser = useQuery(api.users.getCurrent);
  const isAdmin = useQuery(api.users.isOrganizationAdmin);
  const showDevTools = isTestEmail(currentUser?.email);
  // Don't show admin tab while loading to prevent UI flicker
  const showAdminTab = isAdmin === true;

  // Get tab from URL search params (e.g., /settings/profile?tab=admin)
  const search = useSearch({ strict: false }) as { tab?: string };
  const urlTab = search?.tab;
  const initialTab: TabValue =
    urlTab && validTabs.includes(urlTab as TabValue) ? (urlTab as TabValue) : "integrations";

  // Use controlled tabs for URL-based navigation
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  return (
    <div className="min-h-screen bg-ui-bg-secondary">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Typography variant="h1" className="text-2xl sm:text-3xl font-bold">
            Settings
          </Typography>
          <Typography variant="muted" className="mt-1 sm:mt-2 text-sm sm:text-base">
            Manage your account, integrations, and preferences
          </Typography>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          className="w-full"
        >
          <TabsList className="mb-6 sm:mb-8 -mx-3 sm:mx-0 px-3 sm:px-0 w-full justify-start overflow-x-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="apikeys">API Keys</TabsTrigger>
            <TabsTrigger value="offline">Offline Mode</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            {showAdminTab && <TabsTrigger value="admin">Admin</TabsTrigger>}
            {showDevTools && <TabsTrigger value="developer">Dev Tools</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
          <TabsContent value="integrations">
            <IntegrationsTab />
          </TabsContent>
          <TabsContent value="apikeys">
            <ApiKeysManager />
          </TabsContent>
          <TabsContent value="offline">
            <OfflineTab />
          </TabsContent>
          <TabsContent value="preferences">
            <PreferencesTab />
          </TabsContent>
          {showAdminTab && (
            <TabsContent value="admin">
              <AdminTab />
            </TabsContent>
          )}
          {showDevTools && (
            <TabsContent value="developer">
              <DevToolsTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <GitHubIntegration />
      <GoogleCalendarIntegration />
      <PumbleIntegration />
    </div>
  );
}

function AdminTab() {
  return (
    <div className="space-y-8">
      <OrganizationSettings />
      <UserManagement />
      <UserTypeManager />
      <HourComplianceDashboard />
    </div>
  );
}
