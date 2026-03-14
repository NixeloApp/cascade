import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { render, screen, waitFor } from "@/test/custom-render";
import { WebhooksManager } from "./WebhooksManager";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useDeleteConfirmation", () => ({
  useDeleteConfirmation: vi.fn(),
}));

vi.mock("./ui/Button", () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("./ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({
    title,
    description,
    action,
  }: {
    title: string;
    description?: string;
    action?: ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      {description && <div>{description}</div>}
      {action}
    </div>
  ),
}));

vi.mock("./ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    title,
    message,
    confirmLabel,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
  }) =>
    isOpen ? (
      <div>
        <div>{title}</div>
        <div>{message}</div>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button type="button" onClick={() => void onConfirm()}>
          {confirmLabel ?? "Confirm"}
        </button>
      </div>
    ) : null,
}));

vi.mock("./ui/EmptyState", () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}));

vi.mock("./ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./Webhooks/WebhookCard", () => ({
  WebhookCard: ({
    webhook,
    onEdit,
    onDelete,
  }: {
    webhook: { name: string };
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <div>
      <div>{webhook.name}</div>
      <button type="button" onClick={onEdit}>
        {`Edit ${webhook.name}`}
      </button>
      <button type="button" onClick={onDelete}>
        {`Delete ${webhook.name}`}
      </button>
    </div>
  ),
}));

vi.mock("./Webhooks/WebhookForm", () => ({
  WebhookForm: ({ open, webhook }: { open: boolean; webhook?: { name: string } | null }) =>
    open ? <div>{webhook ? `form:${webhook.name}` : "form:create"}</div> : null,
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseDeleteConfirmation = vi.mocked(useDeleteConfirmation);

const deleteWebhookMutation = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const confirmDelete = vi.fn();
const cancelDelete = vi.fn();
const executeDelete = vi.fn();

const projectId = "project_1" as Id<"projects">;
const webhookId = "webhook_1" as Id<"webhooks">;
const webhook = {
  _id: webhookId,
  name: "Slack Alerts",
  url: "https://example.com/hooks/slack",
  secret: "secret",
  events: ["issue.created"],
  isActive: true,
  lastTriggered: undefined,
};

describe("WebhooksManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteWebhookMutation.mockResolvedValue(undefined);

    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: deleteWebhookMutation,
      canAct: true,
      isAuthLoading: false,
    });
    mockUseDeleteConfirmation.mockReturnValue({
      deleteId: null,
      isDeleting: false,
      confirmDelete,
      cancelDelete,
      executeDelete,
    });
  });

  it("renders the empty state and opens the create form", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReturnValue([]);

    render(<WebhooksManager projectId={projectId} />);

    expect(screen.getByText("No webhooks configured")).toBeInTheDocument();
    expect(
      screen.getByText("Add webhooks to integrate with external services"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Webhook" }));

    expect(screen.getByText("form:create")).toBeInTheDocument();
  });

  it("renders existing webhooks and passes the selected webhook into edit mode", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReturnValue([webhook]);

    render(<WebhooksManager projectId={projectId} />);

    expect(screen.getByText("Slack Alerts")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Slack Alerts" }));

    expect(screen.getByText("form:Slack Alerts")).toBeInTheDocument();
  });

  it("wires delete confirmation through to the delete mutation", async () => {
    const user = userEvent.setup();

    executeDelete.mockImplementation(async (callback: (id: Id<"webhooks">) => Promise<void>) => {
      await callback(webhookId);
    });
    mockUseAuthenticatedQuery.mockReturnValue([webhook]);
    mockUseDeleteConfirmation.mockReturnValue({
      deleteId: webhookId,
      isDeleting: false,
      confirmDelete,
      cancelDelete,
      executeDelete,
    });

    render(<WebhooksManager projectId={projectId} />);

    await user.click(screen.getByRole("button", { name: "Delete Slack Alerts" }));
    expect(confirmDelete).toHaveBeenCalledWith(webhookId);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(executeDelete).toHaveBeenCalledTimes(1));
    expect(deleteWebhookMutation).toHaveBeenCalledWith({ id: webhookId });
  });
});
