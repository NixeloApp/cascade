import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock toast
vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

// Mock data
let mockCurrentUser: { _id: string; email: string; isTestUser: boolean; name: string } | undefined;
const mockResetOnboarding = vi.fn();

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => mockCurrentUser),
  useMutation: vi.fn(() => mockResetOnboarding),
}));

// Import after mocks
import { showError, showSuccess } from "@/lib/toast";
import { DevToolsTab } from "./DevToolsTab";

describe("DevToolsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = {
      _id: "user-123",
      email: "test@inbox.mailtrap.io",
      isTestUser: true,
      name: "Test User",
    };
    mockResetOnboarding.mockResolvedValue({});
  });

  describe("Rendering", () => {
    it("should render info banner", () => {
      render(<DevToolsTab />);

      expect(screen.getByText("Test Account Tools")).toBeInTheDocument();
    });

    it("should render onboarding section", () => {
      render(<DevToolsTab />);

      expect(screen.getByText("Onboarding")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reset Onboarding" })).toBeInTheDocument();
    });

    it("should render current user info section", () => {
      render(<DevToolsTab />);

      expect(screen.getByText("Current User Info")).toBeInTheDocument();
    });

    it("should display user email", () => {
      render(<DevToolsTab />);

      expect(screen.getByText("test@inbox.mailtrap.io")).toBeInTheDocument();
    });

    it("should display user ID", () => {
      render(<DevToolsTab />);

      expect(screen.getByText("user-123")).toBeInTheDocument();
    });

    it("should display test user status", () => {
      render(<DevToolsTab />);

      expect(screen.getByText("Yes")).toBeInTheDocument();
    });

    it("should show loading state when user is not loaded", () => {
      mockCurrentUser = undefined;
      render(<DevToolsTab />);

      expect(screen.getByText("Loading user info...")).toBeInTheDocument();
    });
  });

  describe("Reset Onboarding", () => {
    it("should call resetOnboarding mutation when button is clicked", async () => {
      const user = userEvent.setup();
      render(<DevToolsTab />);

      await user.click(screen.getByRole("button", { name: "Reset Onboarding" }));

      expect(mockResetOnboarding).toHaveBeenCalledTimes(1);
    });

    it("should show success toast on successful reset", async () => {
      const user = userEvent.setup();
      render(<DevToolsTab />);

      await user.click(screen.getByRole("button", { name: "Reset Onboarding" }));

      expect(showSuccess).toHaveBeenCalledWith(
        "Onboarding reset! Refresh the page to see onboarding again.",
      );
    });

    it("should show error toast on failed reset", async () => {
      const user = userEvent.setup();
      const error = new Error("Reset failed");
      mockResetOnboarding.mockRejectedValueOnce(error);

      render(<DevToolsTab />);

      await user.click(screen.getByRole("button", { name: "Reset Onboarding" }));

      expect(showError).toHaveBeenCalledWith(error, "Failed to reset onboarding");
    });

    it("should disable button when user is not loaded", () => {
      mockCurrentUser = undefined;
      render(<DevToolsTab />);

      expect(screen.getByRole("button", { name: "Reset Onboarding" })).toBeDisabled();
    });
  });

  describe("Non-Test User", () => {
    it("should show No for non-test users", () => {
      mockCurrentUser = {
        _id: "user-456",
        email: "regular@example.com",
        isTestUser: false,
        name: "Regular User",
      };

      render(<DevToolsTab />);

      expect(screen.getByText("No")).toBeInTheDocument();
    });
  });
});
