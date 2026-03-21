import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { render, screen, waitFor } from "@/test/custom-render";

const mockConnectSlack = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockDisconnectSlack = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { SlackIntegration } from "./SlackIntegration";

describe("SlackIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let mutationCall = 0;
    const mutationResults = [
      { mutate: mockConnectSlack, canAct: true, isAuthLoading: false },
      { mutate: mockDisconnectSlack, canAct: true, isAuthLoading: false },
    ];
    mockUseAuthenticatedMutation.mockImplementation(() => {
      const result = mutationResults[mutationCall % mutationResults.length];
      mutationCall += 1;
      return result;
    });
    mockUseAuthenticatedQuery.mockReturnValue(null);
    mockConnectSlack.mockResolvedValue(undefined);
    mockDisconnectSlack.mockResolvedValue(undefined);
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

  it("renders the connected state summary", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      teamName: "Nixelo Team",
      hasIncomingWebhook: true,
    });

    render(<SlackIntegration />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Nixelo Team")).toBeInTheDocument();
    expect(screen.getByText("Incoming webhook: Enabled")).toBeInTheDocument();
  });

  it("ignores malformed slack-connected payload from allowed origin", async () => {
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
            },
          },
        }),
      );
    });

    await waitFor(() => expect(mockConnectSlack).not.toHaveBeenCalled());
  });
});
