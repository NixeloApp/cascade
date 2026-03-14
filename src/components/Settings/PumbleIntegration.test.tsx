import type { Doc, Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { type ReactMutation, useAction } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor, within } from "@/test/custom-render";
import { PumbleIntegration } from "./PumbleIntegration";

interface DialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

vi.mock("@tanstack/react-form", () => ({
  useForm: (() => {
    const mockForm = {
      reset: vi.fn(),
      setFieldValue: vi.fn(),
      handleSubmit: vi.fn(),
      Field: () => null,
      Subscribe: () => null,
    };
    return () => mockForm;
  })(),
}));

vi.mock("convex/react", () => ({
  useAction: vi.fn(),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({ open, title }: DialogProps) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {title}
      </div>
    ) : null,
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

const mockUseAction = vi.mocked(useAction);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

const mockAddWebhook = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockPumbleMutation = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockTestWebhook = vi.fn();

const projectId = "project-1" as Id<"projects">;
const projects = [
  {
    _id: projectId,
    name: "Apollo",
    key: "APL",
  },
] as Doc<"projects">[];

const activeWebhook = {
  _id: "webhook-1" as Id<"pumbleWebhooks">,
  _creationTime: 1,
  name: "Team Chat",
  webhookUrl: "https://api.pumble.com/webhooks/abcdefgh1234567890",
  projectId,
  events: ["issue.created", "issue.updated"],
  isActive: true,
  sendMentions: true,
  sendAssignments: true,
  sendStatusChanges: true,
  messagesSent: 3,
  lastMessageAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  userId: "user-1" as Id<"users">,
} as Doc<"pumbleWebhooks">;

describe("PumbleIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAction.mockImplementation(() => mockTestWebhook);
    let queryCallCount = 0;
    const queryResults = [[], { page: projects }];
    mockUseAuthenticatedQuery.mockImplementation(() => {
      const result = queryResults[queryCallCount % queryResults.length];
      queryCallCount += 1;
      return result;
    });
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: mockAddWebhook,
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("shows the empty state and opens the add webhook modal", async () => {
    const user = userEvent.setup();

    render(<PumbleIntegration />);

    expect(screen.getByText("No Pumble webhooks configured")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Your First Webhook" }));

    expect(screen.getByRole("dialog", { name: "Add Pumble Webhook" })).toBeInTheDocument();
  });

  it("renders configured webhooks and handles test, disable, and delete actions", async () => {
    const user = userEvent.setup();
    mockTestWebhook.mockResolvedValue(undefined);
    mockPumbleMutation.mockResolvedValue(undefined);
    let queryCallCount = 0;
    const queryResults = [[activeWebhook], { page: projects }];
    mockUseAuthenticatedQuery.mockImplementation(() => {
      const result = queryResults[queryCallCount % queryResults.length];
      queryCallCount += 1;
      return result;
    });
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: mockPumbleMutation,
      canAct: true,
      isAuthLoading: false,
    });

    render(<PumbleIntegration />);

    expect(screen.getByText("Team Chat")).toBeInTheDocument();
    expect(screen.getByText("Project: Apollo")).toBeInTheDocument();
    expect(screen.getByText("created")).toBeInTheDocument();
    expect(screen.getByText("updated")).toBeInTheDocument();
    expect(screen.getByText(/Last triggered:/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Test Webhook" }));

    await waitFor(() =>
      expect(mockTestWebhook).toHaveBeenCalledWith({
        webhookId: activeWebhook._id,
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Test message sent to Pumble!");

    await user.click(screen.getByRole("button", { name: "Disable" }));

    await waitFor(() =>
      expect(mockPumbleMutation).toHaveBeenCalledWith({
        webhookId: activeWebhook._id,
        isActive: false,
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Webhook disabled");

    await user.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = screen.getByRole("dialog", { name: "Delete Webhook" });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete webhook "Team Chat"?'),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(mockPumbleMutation).toHaveBeenCalledWith({
        webhookId: activeWebhook._id,
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Webhook deleted");
    expect(mockShowError).not.toHaveBeenCalled();
  });
});
