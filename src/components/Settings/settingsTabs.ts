export const SETTINGS_TAB_VALUES = [
  "profile",
  "security",
  "notifications",
  "integrations",
  "apikeys",
  "offline",
  "preferences",
  "admin",
  "developer",
] as const;

export type SettingsTabValue = (typeof SETTINGS_TAB_VALUES)[number];

type SettingsTabVisibility = "all" | "admin" | "devtools";

export interface SettingsTabDefinition {
  label: string;
  value: SettingsTabValue;
  visibility: SettingsTabVisibility;
}

export const SETTINGS_TABS: readonly SettingsTabDefinition[] = [
  { value: "profile", label: "Profile", visibility: "all" },
  { value: "security", label: "Security", visibility: "all" },
  { value: "notifications", label: "Notifications", visibility: "all" },
  { value: "integrations", label: "Integrations", visibility: "all" },
  { value: "apikeys", label: "API Keys", visibility: "all" },
  { value: "offline", label: "Offline Mode", visibility: "all" },
  { value: "preferences", label: "Preferences", visibility: "all" },
  { value: "admin", label: "Admin", visibility: "admin" },
  { value: "developer", label: "Dev Tools", visibility: "devtools" },
];

interface SettingsTabVisibilityOptions {
  isAdmin: boolean;
  showDevTools: boolean;
}

export function isSettingsTabValue(value: unknown): value is SettingsTabValue {
  return (
    typeof value === "string" &&
    SETTINGS_TAB_VALUES.includes(value as (typeof SETTINGS_TAB_VALUES)[number])
  );
}

export function getVisibleSettingsTabs(options: SettingsTabVisibilityOptions) {
  return SETTINGS_TABS.filter((tab) => {
    if (tab.visibility === "all") {
      return true;
    }

    if (tab.visibility === "admin") {
      return options.isAdmin;
    }

    return options.showDevTools;
  });
}

export function resolveSettingsTab(
  requestedTab: SettingsTabValue,
  visibleTabs: readonly SettingsTabDefinition[],
) {
  return (
    visibleTabs.find((tab) => tab.value === requestedTab)?.value ??
    visibleTabs[0]?.value ??
    "profile"
  );
}
