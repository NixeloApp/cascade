import { api } from "@convex/_generated/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { render, screen, waitFor } from "@/test/custom-render";
import { Settings } from "./Settings";

vi.mock("@convex/_generated/api", () => ({
  api: {
    users: {
      getCurrent: "users.getCurrent",
      isOrganizationAdmin: "users.isOrganizationAdmin",
    },
  },
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("./Settings/ProfileTab", () => ({
  ProfileTab: () => <div>Profile Content</div>,
}));

vi.mock("./Settings/TwoFactorSettings", () => ({
  TwoFactorSettings: () => <div>Security Content</div>,
}));

vi.mock("./Settings/NotificationsTab", () => ({
  NotificationsTab: () => <div>Notifications Content</div>,
}));

vi.mock("./Settings/PreferencesTab", () => ({
  PreferencesTab: () => <div>Preferences Content</div>,
}));

vi.mock("./Settings/OfflineTab", () => ({
  OfflineTab: () => <div>Offline Content</div>,
}));

vi.mock("./Settings/ApiKeysManager", () => ({
  ApiKeysManager: () => <div>API Keys Content</div>,
}));

vi.mock("./Settings/DevToolsTab", () => ({
  DevToolsTab: () => <div>Developer Content</div>,
}));

vi.mock("./Settings/GitHubIntegration", () => ({
  GitHubIntegration: () => <div>GitHub Integration</div>,
}));

vi.mock("./Settings/SlackIntegration", () => ({
  SlackIntegration: () => <div>Slack Integration</div>,
}));

vi.mock("./Settings/GoogleCalendarIntegration", () => ({
  GoogleCalendarIntegration: () => <div>Google Calendar Integration</div>,
}));

vi.mock("./Settings/PumbleIntegration", () => ({
  PumbleIntegration: () => <div>Pumble Integration</div>,
}));

vi.mock("./Admin/OrganizationSettings", () => ({
  OrganizationSettings: () => <div>Organization Settings</div>,
}));

vi.mock("./Admin/OAuthHealthDashboard", () => ({
  OAuthHealthDashboard: () => <div>OAuth Health</div>,
}));

vi.mock("./Admin/OAuthFeatureFlagSettings", () => ({
  OAuthFeatureFlagSettings: () => <div>OAuth Flags</div>,
}));

vi.mock("./Admin/IpRestrictionsSettings", () => ({
  IpRestrictionsSettings: () => <div>IP Restrictions</div>,
}));

vi.mock("./Admin/UserManagement", () => ({
  UserManagement: () => <div>User Management</div>,
}));

vi.mock("./Admin/UserTypeManager", () => ({
  UserTypeManager: () => <div>User Types</div>,
}));

vi.mock("./Admin/HourComplianceDashboard", () => ({
  HourComplianceDashboard: () => <div>Hour Compliance</div>,
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

function mockQueries({
  currentUserEmail,
  isAdmin,
}: {
  currentUserEmail?: string;
  isAdmin?: boolean;
}) {
  mockUseAuthenticatedQuery.mockImplementation((query) => {
    if (query === api.users.getCurrent) {
      return currentUserEmail ? { email: currentUserEmail } : undefined;
    }
    if (query === api.users.isOrganizationAdmin) {
      return isAdmin;
    }
    return undefined;
  });
}

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the standard tabs and hides admin-only sections for non-admin users", async () => {
    const onTabChange = vi.fn();
    mockQueries({ currentUserEmail: "person@example.com", isAdmin: false });

    const { container } = render(<Settings activeTab="profile" onTabChange={onTabChange} />);

    expect(screen.getByRole("tab", { name: /Profile/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Security/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Notifications/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Integrations/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /API Keys/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Offline Mode/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Preferences/ })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Admin/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Dev Tools/ })).not.toBeInTheDocument();
    expect(screen.getByText("Profile Content")).toBeInTheDocument();

    const tablist = screen.getByRole("tablist", { name: "Settings sections" });
    expect(tablist.closest(".mb-6")).not.toBeNull();
    expect(container.firstChild).toHaveClass("w-full");
    expect(tablist).toHaveClass("bg-transparent");
  });

  it("shows admin and developer tabs when the user is an admin on a test inbox account", () => {
    const onTabChange = vi.fn();
    mockQueries({ currentUserEmail: "qa@inbox.mailtrap.io", isAdmin: true });

    render(<Settings activeTab="admin" onTabChange={onTabChange} />);

    expect(screen.getByRole("tab", { name: /Admin/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Dev Tools/ })).toBeInTheDocument();
    expect(screen.getByText("Organization Settings")).toBeInTheDocument();
    expect(screen.getByText("Hour Compliance")).toBeInTheDocument();
  });

  it("canonicalizes a restricted requested tab back to profile when it is not visible", async () => {
    const onTabChange = vi.fn();
    mockQueries({ currentUserEmail: "person@example.com", isAdmin: false });

    render(<Settings activeTab="admin" onTabChange={onTabChange} />);

    await waitFor(() => {
      expect(onTabChange).toHaveBeenCalledWith("profile");
    });

    expect(screen.getByText("Profile Content")).toBeInTheDocument();
  });
});
