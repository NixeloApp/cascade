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
  shortLabel?: string;
  value: SettingsTabValue;
  visibility: SettingsTabVisibility;
}

export const SETTINGS_TABS: readonly SettingsTabDefinition[] = [
  { value: "profile", label: "Profile", visibility: "all" },
  { value: "security", label: "Security", shortLabel: "Lock", visibility: "all" },
  { value: "notifications", label: "Notifications", shortLabel: "Alerts", visibility: "all" },
  { value: "integrations", label: "Integrations", shortLabel: "Apps", visibility: "all" },
  { value: "apikeys", label: "API Keys", shortLabel: "API", visibility: "all" },
  { value: "offline", label: "Offline Mode", shortLabel: "Off", visibility: "all" },
  { value: "preferences", label: "Preferences", shortLabel: "Prefs", visibility: "all" },
  { value: "admin", label: "Admin", shortLabel: "Adm", visibility: "admin" },
  { value: "developer", label: "Dev Tools", shortLabel: "Dev", visibility: "devtools" },
];

interface SettingsTabVisibilityOptions {
  isAdmin: boolean;
  showDevTools: boolean;
}

/** Returns true when the provided value matches a supported settings tab key. */
export function isSettingsTabValue(value: unknown): value is SettingsTabValue {
  return (
    typeof value === "string" &&
    SETTINGS_TAB_VALUES.includes(value as (typeof SETTINGS_TAB_VALUES)[number])
  );
}

/** Filters the canonical tab list down to the tabs that should be visible for the user. */
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

/** Resolves a requested tab to a visible tab, falling back to the first allowed entry. */
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
