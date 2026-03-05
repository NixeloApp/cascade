import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";

const mockConnectSlack = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn(),
});
const mockDisconnectSlack = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn(),
});
const mockUseMutation = vi.mocked(useMutation);
const mockUseQuery = vi.mocked(useQuery);

vi.mock("convex/react", () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { SlackIntegration } from "./SlackIntegration";

describe("SlackIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(null);
    mockUseMutation.mockReturnValueOnce(mockConnectSlack).mockReturnValueOnce(mockDisconnectSlack);
    mockConnectSlack.mockResolvedValue({ success: true });
    mockDisconnectSlack.mockResolvedValue({ success: true });
    vi.spyOn(window, "open").mockReturnValue(null);
  });

  it("accepts slack-connected postMessage from popup origin", async () => {
    const user = userEvent.setup();
    render(<SlackIntegration />);

    await user.click(screen.getByRole("button", { name: "Connect Slack" }));

    expect(window.open).toHaveBeenCalledTimes(1);
    const authUrl = vi.mocked(window.open).mock.calls[0]?.[0];
    expect(typeof authUrl).toBe("string");
    const popupOrigin = new URL(String(authUrl)).origin;

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: popupOrigin,
          data: {
            type: "slack-connected",
            data: {
              teamId: "T123",
              teamName: "Nixelo Team",
              accessToken: "xoxb-test",
            },
          },
        }),
      );
    });

    await waitFor(() =>
      expect(mockConnectSlack).toHaveBeenCalledWith({
        slackUserId: undefined,
        teamId: "T123",
        teamName: "Nixelo Team",
        accessToken: "xoxb-test",
        botUserId: undefined,
        scope: undefined,
        incomingWebhookUrl: undefined,
        incomingWebhookChannel: undefined,
      }),
    );
  });

  it("ignores slack-connected postMessage from unknown origin", async () => {
    render(<SlackIntegration />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://evil.example",
          data: {
            type: "slack-connected",
            data: {
              teamId: "T123",
              teamName: "Nixelo Team",
              accessToken: "xoxb-test",
            },
          },
        }),
      );
    });

    await waitFor(() => expect(mockConnectSlack).not.toHaveBeenCalled());
  });

  it("ignores malformed slack-connected payload from allowed origin", async () => {
    const user = userEvent.setup();
    render(<SlackIntegration />);

    await user.click(screen.getByRole("button", { name: "Connect Slack" }));

    const authUrl = vi.mocked(window.open).mock.calls[0]?.[0];
    const popupOrigin = new URL(String(authUrl)).origin;

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: popupOrigin,
          data: {
            type: "slack-connected",
            data: {
              teamId: "T123",
              teamName: "Nixelo Team",
            },
          },
        }),
      );
    });

    await waitFor(() => expect(mockConnectSlack).not.toHaveBeenCalled());
  });
});
