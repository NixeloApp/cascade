import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { IntakeSettings } from "./IntakeSettings";

vi.mock("@convex/_generated/api", () => ({
  api: {
    intake: {
      getTokenStatus: "intake.getTokenStatus",
      createToken: "intake.createToken",
      revokeToken: "intake.revokeToken",
    },
  },
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/lib/convex", () => ({
  getConvexSiteUrl: () => "https://test.convex.site",
}));

vi.mock("@/lib/icons", () => ({
  Check: () => "check-icon",
  Copy: () => "copy-icon",
  Key: () => "key-icon",
  LinkIcon: () => "link-icon",
  RotateCcw: () => "rotate-icon",
  Trash2: () => "trash-icon",
}));

vi.mock("../ui/Icon", () => ({
  Icon: ({ icon: IconComponent }: { icon: () => string }) => (
    <span>{typeof IconComponent === "function" ? IconComponent() : "icon"}</span>
  ),
}));

vi.mock("../ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    title,
    message,
  }: {
    isOpen: boolean;
    title: string;
    message: string;
  }) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <div>{title}</div>
        <div>{message}</div>
      </div>
    ) : null,
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockCreateToken = vi.fn();
const mockRevokeToken = vi.fn();

const defaultProps = {
  projectId: "project-1" as Id<"projects">,
};

describe("IntakeSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCreateToken.mockResolvedValue({ token: "intake_new123" });
    mockRevokeToken.mockResolvedValue({ success: true });

    // First call = getTokenStatus, remaining calls = other queries
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    const createMutationProxy = Object.assign(mockCreateToken, {
      withOptimisticUpdate: () => createMutationProxy,
    }) as ReactMutation<FunctionReference<"mutation">>;
    const revokeMutationProxy = Object.assign(mockRevokeToken, {
      withOptimisticUpdate: () => revokeMutationProxy,
    }) as ReactMutation<FunctionReference<"mutation">>;

    let mutationCallCount = 0;
    mockUseAuthenticatedMutation.mockImplementation(() => {
      mutationCallCount++;
      return {
        mutate: mutationCallCount % 2 === 1 ? createMutationProxy : revokeMutationProxy,
        canAct: true,
        isAuthLoading: false,
      };
    });
  });

  it("shows loading state while token status is undefined", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(<IntakeSettings {...defaultProps} />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows enable button when no token exists", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      exists: false,
      token: null,
      createdAt: null,
    });

    render(<IntakeSettings {...defaultProps} />);

    expect(screen.getByRole("button", { name: /enable external intake/i })).toBeInTheDocument();
    expect(screen.queryByText("Intake Token")).not.toBeInTheDocument();
  });

  it("shows token details when token exists", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      exists: true,
      token: "intake_abc123def456",
      createdAt: Date.now(),
    });

    render(<IntakeSettings {...defaultProps} />);

    expect(screen.getByText("Intake Token")).toBeInTheDocument();
    expect(screen.getByText("Endpoint URL")).toBeInTheDocument();
    expect(screen.getByText("Example Request")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /revoke token/i })).toBeInTheDocument();
  });

  it("masks the token in the token display field", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      exists: true,
      token: "intake_abc123def456ghi789",
      createdAt: Date.now(),
    });

    render(<IntakeSettings {...defaultProps} />);

    // The masked token shows first 12 chars followed by bullet characters
    // "intake_abc12" + "••••••••" (8 bullets)
    const maskedEl = screen.getByText(/^intake_abc12/);
    expect(maskedEl.textContent).toHaveLength(20); // 12 prefix + 8 mask chars
  });

  it("creates token when enable button is clicked", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReturnValue({
      exists: false,
      token: null,
      createdAt: null,
    });

    render(<IntakeSettings {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /enable external intake/i }));

    await waitFor(() => {
      expect(mockCreateToken).toHaveBeenCalled();
    });
    expect(vi.mocked(showSuccess)).toHaveBeenCalledWith("Intake token created");
  });

  it("shows revoke confirmation dialog", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReturnValue({
      exists: true,
      token: "intake_abc123def456",
      createdAt: Date.now(),
    });

    render(<IntakeSettings {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /revoke token/i }));

    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(screen.getByText("Revoke Intake Token")).toBeInTheDocument();
  });

  it("shows error toast on create failure", async () => {
    const user = userEvent.setup();
    mockCreateToken.mockRejectedValue(new Error("Network error"));
    mockUseAuthenticatedQuery.mockReturnValue({
      exists: false,
      token: null,
      createdAt: null,
    });

    render(<IntakeSettings {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /enable external intake/i }));

    await waitFor(() => {
      expect(vi.mocked(showError)).toHaveBeenCalledWith(
        expect.any(Error),
        "Failed to create intake token",
      );
    });
  });

  it("shows curl example with token", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      exists: true,
      token: "intake_testtoken123",
      createdAt: Date.now(),
    });

    render(<IntakeSettings {...defaultProps} />);

    expect(screen.getByText("Example Request")).toBeInTheDocument();
    expect(screen.getByText(/curl -X POST/)).toBeInTheDocument();
    expect(screen.getByText(/Bearer intake_testtoken123/)).toBeInTheDocument();
  });
});
