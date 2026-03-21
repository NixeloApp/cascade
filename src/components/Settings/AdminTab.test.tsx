import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/custom-render";
import { AdminTab, getAdminSectionId } from "./AdminTab";

afterEach(() => {
  window.history.pushState({}, "", window.location.pathname + window.location.search);
});

vi.mock("../Admin/OrganizationSettings", () => ({
  OrganizationSettings: () => <div>Organization Settings Content</div>,
}));

vi.mock("../Admin/OAuthHealthDashboard", () => ({
  OAuthHealthDashboard: () => <div>OAuth Health Content</div>,
}));

vi.mock("../Admin/OAuthFeatureFlagSettings", () => ({
  OAuthFeatureFlagSettings: () => <div>OAuth Flags Content</div>,
}));

vi.mock("../Admin/IpRestrictionsSettings", () => ({
  IpRestrictionsSettings: () => <div>IP Restrictions Content</div>,
}));

vi.mock("../Admin/UserManagement", () => ({
  UserManagement: () => <div>User Management Content</div>,
}));

vi.mock("../Admin/UserTypeManager", () => ({
  UserTypeManager: () => <div>User Types Content</div>,
}));

vi.mock("../Admin/HourComplianceDashboard", () => ({
  HourComplianceDashboard: () => <div>Hour Compliance Content</div>,
}));

describe("AdminTab", () => {
  it("renders the shared admin controls shell and section anchors", () => {
    render(<AdminTab />);

    const adminNav = screen.getByRole("navigation", { name: "Admin sections" });
    expect(adminNav.closest(".mb-6")).not.toBeNull();
    expect(screen.getByText("Admin controls")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Organization" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compliance" })).toBeInTheDocument();

    expect(screen.getByText("Organization Settings Content").closest("section")).toHaveAttribute(
      "id",
      getAdminSectionId("organization"),
    );
    expect(screen.getByText("User Management Content").closest("section")).toHaveAttribute(
      "id",
      getAdminSectionId("user-management"),
    );
  });

  it("uses the current hash to mark the matching admin section as active", () => {
    window.history.pushState({}, "", `#${getAdminSectionId("ip-restrictions")}`);

    render(<AdminTab />);

    expect(screen.getByRole("button", { name: "IP Restrictions" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("updates the active admin section when the hash changes", () => {
    render(<AdminTab />);

    window.history.pushState({}, "", `#${getAdminSectionId("hour-compliance")}`);
    fireEvent(window, new Event("hashchange"));

    expect(screen.getByRole("button", { name: "Compliance" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
