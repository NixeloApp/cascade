import { describe, expect, it } from "vitest";
import {
  getOrganizationSettingsHoursInputClassName,
  getOrganizationSettingsNameInputClassName,
} from "./organizationSettingsSurfaceClassNames";

describe("organizationSettingsSurfaceClassNames", () => {
  it("returns the owned width classes for the organization settings form fields", () => {
    expect(getOrganizationSettingsNameInputClassName()).toBe("max-w-md");
    expect(getOrganizationSettingsHoursInputClassName()).toBe("max-w-30");
  });
});
