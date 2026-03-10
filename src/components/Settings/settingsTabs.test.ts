import { describe, expect, it } from "vitest";
import {
  getVisibleSettingsTabs,
  isSettingsTabValue,
  resolveSettingsTab,
  SETTINGS_TABS,
} from "./settingsTabs";

describe("settingsTabs", () => {
  it("accepts only known tab values", () => {
    expect(isSettingsTabValue("profile")).toBe(true);
    expect(isSettingsTabValue("admin")).toBe(true);
    expect(isSettingsTabValue("billing")).toBe(false);
    expect(isSettingsTabValue(undefined)).toBe(false);
  });

  it("filters privileged tabs based on visibility flags", () => {
    expect(
      getVisibleSettingsTabs({
        isAdmin: false,
        showDevTools: false,
      }).map((tab) => tab.value),
    ).toEqual([
      "profile",
      "security",
      "notifications",
      "integrations",
      "apikeys",
      "offline",
      "preferences",
    ]);

    expect(
      getVisibleSettingsTabs({
        isAdmin: true,
        showDevTools: true,
      }).map((tab) => tab.value),
    ).toEqual(SETTINGS_TABS.map((tab) => tab.value));
  });

  it("falls back to the first visible tab when the requested tab is hidden", () => {
    const visibleTabs = getVisibleSettingsTabs({
      isAdmin: false,
      showDevTools: false,
    });

    expect(resolveSettingsTab("admin", visibleTabs)).toBe("profile");
    expect(resolveSettingsTab("profile", visibleTabs)).toBe("profile");
  });
});
