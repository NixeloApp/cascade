import type { Doc, Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import { usePaginatedQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { WebhookLogs } from "./WebhookLogs";

vi.mock("convex/react", () => ({
  usePaginatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("../ui/Badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("../ui/Button", () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({
    open,
    title,
    description,
    children,
  }: {
    open: boolean;
    title: string;
    description?: string;
    children: ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <div>{title}</div>
        {description && <div>{description}</div>}
        {children}
      </div>
    ) : null,
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Grid", () => ({
  Grid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Icon", () => ({
  Icon: () => <span>icon</span>,
}));

vi.mock("../ui/Metadata", () => ({
  Metadata: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MetadataItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUsePaginatedQuery = vi.mocked(usePaginatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

const retryExecution = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const loadMore = vi.fn();

const webhookId = "webhook_1" as Id<"webhooks">;
const successExecutionId = "execution_1" as Id<"webhookExecutions">;
const failedExecutionId = "execution_2" as Id<"webhookExecutions">;

const successExecution: Doc<"webhookExecutions"> = {
  _id: successExecutionId,
  _creationTime: 1_710_000_000_000,
  webhookId,
  event: "issue.created",
  status: "success",
  requestPayload: '{"issueId":"ISS-1","title":"Launch checklist"}',
  responseStatus: 200,
  responseBody: "ok",
  attempts: 1,
  completedAt: 1_710_000_000_450,
};

const failedExecution: Doc<"webhookExecutions"> = {
  _id: failedExecutionId,
  _creationTime: 1_710_000_100_000,
  webhookId,
  event: "issue.updated",
  status: "failed",
  requestPayload: '{"issueId":"ISS-2","changes":["status"]}',
  responseStatus: 500,
  responseBody: "server exploded",
  error: "Connection timeout",
  attempts: 2,
  completedAt: 1_710_000_100_800,
};

describe("WebhookLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    retryExecution.mockResolvedValue(undefined);
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore,
    });
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: retryExecution,
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("renders the empty state when there are no execution logs", () => {
    render(<WebhookLogs webhookId={webhookId} open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Webhook Delivery Logs" })).toBeInTheDocument();
    expect(
      screen.getByText("View recent webhook delivery attempts and their status"),
    ).toBeInTheDocument();
    expect(screen.getByText("No delivery logs yet")).toBeInTheDocument();
    expect(
      screen.getByText("Webhook deliveries will appear here once triggered"),
    ).toBeInTheDocument();
  });

  it("renders execution metadata, expands details, and retries failed deliveries", async () => {
    const user = userEvent.setup();

    vi.spyOn(Date.prototype, "toLocaleString").mockReturnValue("Mar 14, 2026, 10:30 AM");
    mockUsePaginatedQuery.mockReturnValue({
      results: [failedExecution, successExecution],
      status: "Exhausted",
      isLoading: false,
      loadMore,
    });

    render(<WebhookLogs webhookId={webhookId} open={true} onOpenChange={vi.fn()} />);

    expect(mockUsePaginatedQuery).toHaveBeenCalledWith(
      expect.anything(),
      { webhookId },
      { initialNumItems: 50 },
    );
    expect(screen.getByText("Showing 2 most recent deliveries")).toBeInTheDocument();
    expect(screen.getByText("issue.updated")).toBeInTheDocument();
    expect(screen.getByText("issue.created")).toBeInTheDocument();
    expect(screen.getByText("HTTP 500")).toBeInTheDocument();
    expect(screen.getByText("Connection timeout")).toBeInTheDocument();
    expect(screen.getByText("800ms")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Show Details" })[0]);

    expect(screen.getByText("Request Payload:")).toBeInTheDocument();
    expect(screen.getByText(/"issueId": "ISS-2"/)).toBeInTheDocument();
    expect(screen.getByText("Response Body:")).toBeInTheDocument();
    expect(screen.getByText("server exploded")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(retryExecution).toHaveBeenCalledWith({ id: failedExecutionId }));
    expect(mockShowSuccess).toHaveBeenCalledWith("Webhook delivery queued for retry");
  });

  it("surfaces retry failures through the shared error toast", async () => {
    const user = userEvent.setup();
    const error = new Error("retry failed");

    retryExecution.mockRejectedValueOnce(error);
    mockUsePaginatedQuery.mockReturnValue({
      results: [failedExecution],
      status: "Exhausted",
      isLoading: false,
      loadMore,
    });

    render(<WebhookLogs webhookId={webhookId} open={true} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(error, "Failed to retry webhook"),
    );
  });
});
