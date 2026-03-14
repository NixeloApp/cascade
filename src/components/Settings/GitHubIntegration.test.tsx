import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor, within } from "@/test/custom-render";
import { GitHubIntegration } from "./GitHubIntegration";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("./LinkedRepositories", () => ({
  LinkedRepositories: () => <div>Linked repositories</div>,
}));

vi.mock("../ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
  }: ConfirmDialogProps) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <div>{message}</div>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    ) : null,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

const mockConnectGitHub = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockDisconnectGitHub = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

describe("GitHubIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let mutationCall = 0;
    const mutationResults = [
      { mutate: mockConnectGitHub, canAct: true, isAuthLoading: false },
      { mutate: mockDisconnectGitHub, canAct: true, isAuthLoading: false },
    ];
    mockUseAuthenticatedMutation.mockImplementation(() => {
      const result = mutationResults[mutationCall % mutationResults.length];
      mutationCall += 1;
      return result;
    });
    mockUseAuthenticatedQuery.mockReturnValue(null);
    vi.spyOn(window, "open").mockReturnValue(null);
  });

  it("opens the GitHub OAuth popup and saves same-origin connection messages", async () => {
    const user = userEvent.setup();
    mockConnectGitHub.mockResolvedValue(undefined);

    render(<GitHubIntegration />);

    await user.click(screen.getByRole("button", { name: "Connect GitHub" }));

    expect(window.open).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: window.location.origin,
          data: {
            type: "github-connected",
            data: {
              githubUserId: "123",
              githubUsername: "octocat",
              accessToken: "gho_test",
            },
          },
        }),
      );
    });

    await waitFor(() =>
      expect(mockConnectGitHub).toHaveBeenCalledWith({
        githubUserId: "123",
        githubUsername: "octocat",
        accessToken: "gho_test",
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Connected to GitHub as @octocat");
  });

  it("ignores github-connected messages from other origins", async () => {
    render(<GitHubIntegration />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://evil.example",
          data: {
            type: "github-connected",
            data: {
              githubUserId: "123",
              githubUsername: "octocat",
              accessToken: "gho_test",
            },
          },
        }),
      );
    });

    await waitFor(() => expect(mockConnectGitHub).not.toHaveBeenCalled());
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it("renders the connected state and disconnects after confirmation", async () => {
    const user = userEvent.setup();
    mockDisconnectGitHub.mockResolvedValue(undefined);
    mockUseAuthenticatedQuery.mockReturnValue({
      githubUsername: "octocat",
    });

    render(<GitHubIntegration />);

    expect(screen.getByText("Connected as @octocat")).toBeInTheDocument();
    expect(screen.getByText("Linked repositories")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Disconnect" }));

    const dialog = screen.getByRole("dialog", { name: "Disconnect GitHub" });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to disconnect your GitHub account?"),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Disconnect" }));

    await waitFor(() => expect(mockDisconnectGitHub).toHaveBeenCalled());

    expect(mockShowSuccess).toHaveBeenCalledWith("GitHub disconnected successfully");
    expect(mockShowError).not.toHaveBeenCalled();
  });
});
