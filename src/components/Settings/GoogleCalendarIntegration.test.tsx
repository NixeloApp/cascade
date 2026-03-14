import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor, within } from "@/test/custom-render";
import { GoogleCalendarIntegration } from "./GoogleCalendarIntegration";

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

const mockConnectGoogle = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockDisconnectGoogle = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockUpdateSyncSettings = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

const connectedCalendar = {
  providerAccountId: "calendar@example.com",
  syncEnabled: true,
  syncDirection: "bidirectional" as const,
  lastSyncAt: 1_700_000_000_000,
};

describe("GoogleCalendarIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let mutationCall = 0;
    const mutationResults = [
      { mutate: mockConnectGoogle, canAct: true, isAuthLoading: false },
      { mutate: mockDisconnectGoogle, canAct: true, isAuthLoading: false },
      { mutate: mockUpdateSyncSettings, canAct: true, isAuthLoading: false },
    ];
    mockUseAuthenticatedMutation.mockImplementation(() => {
      const result = mutationResults[mutationCall % mutationResults.length];
      mutationCall += 1;
      return result;
    });
    mockUseAuthenticatedQuery.mockReturnValue(null);
    vi.spyOn(window, "open").mockImplementation(() => window);
  });

  it("opens the Google OAuth popup and saves same-origin callback messages", async () => {
    const user = userEvent.setup();
    mockConnectGoogle.mockResolvedValue(undefined);

    render(<GoogleCalendarIntegration />);

    await user.click(screen.getByRole("button", { name: "Connect Google" }));

    expect(window.open).toHaveBeenCalledWith(
      "/google/auth",
      "Google Calendar OAuth",
      expect.stringContaining("width=600"),
    );

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: window.location.origin,
          data: {
            type: "google-calendar-connected",
            data: {
              providerAccountId: "calendar@example.com",
              accessToken: "token",
              refreshToken: "refresh",
              expiresAt: 1234,
            },
          },
        }),
      );
    });

    await waitFor(() =>
      expect(mockConnectGoogle).toHaveBeenCalledWith({
        providerAccountId: "calendar@example.com",
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: 1234,
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Google Calendar connected successfully");
  });

  it("shows an error when the Google popup is blocked", async () => {
    const user = userEvent.setup();
    vi.mocked(window.open).mockReturnValueOnce(null);

    render(<GoogleCalendarIntegration />);

    await user.click(screen.getByRole("button", { name: "Connect Google" }));

    expect(mockShowError).toHaveBeenCalledWith("Please allow popups to connect to Google Calendar");
  });

  it("renders the connected state and updates sync settings", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReturnValue(connectedCalendar);
    mockUpdateSyncSettings.mockResolvedValue(undefined);

    render(<GoogleCalendarIntegration />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("calendar@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Enable Sync" }));

    await waitFor(() =>
      expect(mockUpdateSyncSettings).toHaveBeenNthCalledWith(1, {
        syncEnabled: false,
      }),
    );

    expect(mockShowSuccess).toHaveBeenNthCalledWith(1, "Sync disabled");

    await user.click(screen.getByRole("radio", { name: "Export Only" }));

    await waitFor(() =>
      expect(mockUpdateSyncSettings).toHaveBeenNthCalledWith(2, {
        syncDirection: "export",
      }),
    );

    expect(mockShowSuccess).toHaveBeenNthCalledWith(2, "Sync direction updated");
  });

  it("disconnects after confirmation", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReturnValue(connectedCalendar);
    mockDisconnectGoogle.mockResolvedValue(undefined);

    render(<GoogleCalendarIntegration />);

    await user.click(screen.getByRole("button", { name: "Disconnect" }));

    const dialog = screen.getByRole("dialog", { name: "Disconnect Google Calendar" });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to disconnect Google Calendar?"),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Disconnect" }));

    await waitFor(() => expect(mockDisconnectGoogle).toHaveBeenCalled());

    expect(mockShowSuccess).toHaveBeenCalledWith("Google Calendar disconnected successfully");
    expect(mockShowError).not.toHaveBeenCalled();
  });
});
