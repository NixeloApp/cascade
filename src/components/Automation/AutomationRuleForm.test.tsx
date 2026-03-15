import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock toast
vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import type { Id } from "@convex/_generated/dataModel";
import { AutomationRuleForm } from "./AutomationRuleForm";

describe("AutomationRuleForm", () => {
  const projectId = "project-123" as Id<"projects">;
  const defaultProps = {
    projectId,
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields for creating a new rule", () => {
    render(<AutomationRuleForm {...defaultProps} />);

    expect(screen.getByRole("heading", { name: /create automation rule/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/rule name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/trigger event/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/trigger value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^action \*/i)).toBeInTheDocument();
  });

  it("shows trigger options in the trigger select", () => {
    render(<AutomationRuleForm {...defaultProps} />);

    const triggerSelect = screen.getByLabelText(/trigger event/i);
    expect(triggerSelect).toBeInTheDocument();

    // Verify all trigger options are present
    expect(screen.getByRole("option", { name: "Status Changed" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Assignee Changed" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Priority Changed" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Issue Created" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Label Added" })).toBeInTheDocument();
  });

  it("shows action type options in the action select", () => {
    render(<AutomationRuleForm {...defaultProps} />);

    expect(screen.getByRole("option", { name: "Set Assignee" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Set Priority" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Add Label" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Add Comment" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Send Notification" })).toBeInTheDocument();
  });

  it("renders 'Edit Automation Rule' title when editing an existing rule", () => {
    const existingRule = {
      _id: "rule-1" as Id<"automationRules">,
      name: "My Rule",
      description: "Test description",
      trigger: "status_changed" as const,
      triggerValue: "done",
      actionType: "add_label" as const,
      actionValue: { type: "add_label" as const, label: "reviewed" },
    };

    render(<AutomationRuleForm {...defaultProps} rule={existingRule} />);

    expect(screen.getByRole("heading", { name: /edit automation rule/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/rule name/i)).toHaveValue("My Rule");
  });
});
