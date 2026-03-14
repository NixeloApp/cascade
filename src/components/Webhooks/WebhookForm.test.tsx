import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ChangeEvent, ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { WebhookForm } from "./WebhookForm";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/form", () => ({
  FormInput: ({
    field,
    label,
    type,
    placeholder,
    helperText,
  }: {
    field: { state: { value: string }; handleChange: (value: string) => void };
    label: string;
    type?: string;
    placeholder?: string;
    helperText?: string;
  }) => (
    <label>
      <span>{label}</span>
      <input
        aria-label={label}
        type={type}
        placeholder={placeholder}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
      />
      {helperText && <span>{helperText}</span>}
    </label>
  ),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("../ui/Button", () => ({
  Button: ({
    children,
    type,
    onClick,
    disabled,
    isLoading,
  }: {
    children: ReactNode;
    type?: "button" | "submit";
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  }) => (
    <button type={type ?? "button"} onClick={onClick} disabled={disabled || isLoading}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({ open, title, children }: { open: boolean; title: string; children: ReactNode }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <div>{title}</div>
        {children}
      </div>
    ) : null,
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/form/Checkbox", () => ({
  Checkbox: ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <label>
      <input aria-label={label} type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  ),
}));

vi.mock("../ui/Label", () => ({
  Label: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Stack", () => ({
  Stack: ({
    children,
    as: Component = "div",
    onSubmit,
  }: {
    children: ReactNode;
    as?: "form" | "div";
    onSubmit?: (event: React.FormEvent) => void;
  }) => <Component onSubmit={onSubmit}>{children}</Component>,
}));

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);

const createWebhook = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const updateWebhook = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const onOpenChange = vi.fn();
const projectId = "project_1" as Id<"projects">;

describe("WebhookForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let mutationIndex = 0;
    mockUseAuthenticatedMutation.mockImplementation(() =>
      mutationIndex++ % 2 === 0
        ? { mutate: createWebhook, canAct: true, isAuthLoading: false }
        : { mutate: updateWebhook, canAct: true, isAuthLoading: false },
    );
  });

  it("creates a webhook with trimmed values and selected events", async () => {
    const user = userEvent.setup();
    createWebhook.mockResolvedValue(undefined);

    render(<WebhookForm projectId={projectId} open={true} onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("Webhook Name"), "  Team Alerts  ");
    await user.type(screen.getByLabelText("Webhook URL"), "  https://example.com/hooks/team  ");
    await user.type(screen.getByLabelText("Secret (Optional)"), "  signing-secret  ");
    await user.click(screen.getByLabelText("Issue Created"));
    await user.click(screen.getByLabelText("Comment Added"));
    await user.click(screen.getByRole("button", { name: "Create Webhook" }));

    await waitFor(() =>
      expect(createWebhook).toHaveBeenCalledWith({
        projectId,
        name: "Team Alerts",
        url: "https://example.com/hooks/team",
        secret: "signing-secret",
        events: ["issue.created", "comment.created"],
      }),
    );
    expect(showSuccess).toHaveBeenCalledWith("Webhook created");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("prefills edit mode and updates the existing webhook", async () => {
    const user = userEvent.setup();
    updateWebhook.mockResolvedValue(undefined);

    render(
      <WebhookForm
        projectId={projectId}
        open={true}
        onOpenChange={onOpenChange}
        webhook={{
          _id: "webhook_1" as Id<"webhooks">,
          name: "Existing Hook",
          url: "https://example.com/hooks/existing",
          secret: "existing-secret",
          events: ["issue.updated", "sprint.ended"],
        }}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Edit Webhook" })).toBeInTheDocument();
    expect(screen.getByLabelText("Webhook Name")).toHaveValue("Existing Hook");
    expect(screen.getByLabelText("Webhook URL")).toHaveValue("https://example.com/hooks/existing");
    expect(screen.getByLabelText("Secret (Optional)")).toHaveValue("existing-secret");
    expect(screen.getByLabelText("Issue Updated")).toBeChecked();
    expect(screen.getByLabelText("Sprint Ended")).toBeChecked();

    await user.clear(screen.getByLabelText("Webhook Name"));
    await user.type(screen.getByLabelText("Webhook Name"), "Updated Hook");
    await user.click(screen.getByLabelText("Sprint Ended"));
    await user.click(screen.getByLabelText("Issue Deleted"));
    await user.click(screen.getByRole("button", { name: "Update Webhook" }));

    await waitFor(() =>
      expect(updateWebhook).toHaveBeenCalledWith({
        id: "webhook_1",
        name: "Updated Hook",
        url: "https://example.com/hooks/existing",
        secret: "existing-secret",
        events: ["issue.updated", "issue.deleted"],
      }),
    );
    expect(showSuccess).toHaveBeenCalledWith("Webhook updated");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows a validation error when no events are selected", async () => {
    const user = userEvent.setup();

    render(<WebhookForm projectId={projectId} open={true} onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("Webhook Name"), "No Events Hook");
    await user.type(screen.getByLabelText("Webhook URL"), "https://example.com/hooks/no-events");
    await user.click(screen.getByRole("button", { name: "Create Webhook" }));

    expect(screen.getByText("Select at least one event")).toBeInTheDocument();
    expect(showError).toHaveBeenCalledWith("Select at least one event");
    expect(createWebhook).not.toHaveBeenCalled();
    expect(updateWebhook).not.toHaveBeenCalled();
  });
});
