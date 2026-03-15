import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/custom-render";
import { AutomationRuleCard } from "./AutomationRuleCard";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: () => ({
    mutate: vi.fn(),
    canAct: true,
    isAuthLoading: false,
  }),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockRule = {
  _id: "rule_1" as Id<"automationRules">,
  name: "Auto-assign on create",
  description: "Assigns new issues to the team lead",
  trigger: "issue_created" as const,
  actionType: "set_assignee" as const,
  actionValue: { type: "set_assignee" as const, assigneeId: "user_123" as Id<"users"> },
  isActive: true,
  executionCount: 42,
};

describe("AutomationRuleCard", () => {
  it("renders rule name and description", () => {
    render(<AutomationRuleCard rule={mockRule} onEdit={() => {}} onDelete={() => {}} />);

    expect(screen.getByText("Auto-assign on create")).toBeInTheDocument();
    expect(screen.getByText("Assigns new issues to the team lead")).toBeInTheDocument();
  });

  it("shows execution count", () => {
    render(<AutomationRuleCard rule={mockRule} onEdit={() => {}} onDelete={() => {}} />);

    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it("shows active badge when rule is active", () => {
    render(<AutomationRuleCard rule={mockRule} onEdit={() => {}} onDelete={() => {}} />);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows paused badge when rule is inactive", () => {
    render(
      <AutomationRuleCard
        rule={{ ...mockRule, isActive: false }}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();

    render(<AutomationRuleCard rule={mockRule} onEdit={onEdit} onDelete={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("calls onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();

    render(<AutomationRuleCard rule={mockRule} onEdit={() => {}} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledOnce();
  });
});
