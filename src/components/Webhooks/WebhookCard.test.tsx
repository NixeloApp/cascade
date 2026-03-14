import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { WebhookCard } from "./WebhookCard";

const LAST_TRIGGERED = Date.UTC(2026, 2, 14, 15, 9, 26);

const baseWebhook = {
  _id: "webhook_1" as Id<"webhooks">,
  name: "Issue updates",
  url: "https://example.com/hooks/issues",
  isActive: true,
  events: ["issue.created", "issue.updated"],
  lastTriggered: LAST_TRIGGERED,
};

describe("WebhookCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the active webhook details, events, and formatted last-triggered timestamp", () => {
    vi.spyOn(Date.prototype, "toLocaleString").mockReturnValue("Mar 14, 2026, 3:09 PM");

    render(<WebhookCard webhook={baseWebhook} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Issue updates")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/hooks/issues")).toBeInTheDocument();
    expect(screen.getByText("issue.created")).toBeInTheDocument();
    expect(screen.getByText("issue.updated")).toBeInTheDocument();
    expect(screen.getByText("Last triggered: Mar 14, 2026, 3:09 PM")).toBeInTheDocument();
  });

  it("renders the inactive state and omits the last-triggered copy when it is missing", () => {
    render(
      <WebhookCard
        webhook={{
          ...baseWebhook,
          isActive: false,
          lastTriggered: undefined,
        }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.queryByText(/Last triggered:/)).not.toBeInTheDocument();
  });

  it("fires the edit and delete callbacks from the action buttons", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<WebhookCard webhook={baseWebhook} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
