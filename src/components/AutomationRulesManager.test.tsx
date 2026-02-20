// Helper to create properly typed mock IDs
import type { Id, TableNames } from "@convex/_generated/dataModel";
import type { AutomationActionValue } from "@convex/validators";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { AutomationRulesManager } from "./AutomationRulesManager";

function mockId<T extends TableNames>(id: string): Id<T> {
  return id as Id<T>;
}

// Mock dependencies
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock toast utilities used by AutomationRulesManager
vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe("AutomationRulesManager - Component Behavior", () => {
  const mockProjectId = mockId<"projects">("project123");
  const _mockCreateRule = vi.fn();
  const mockUpdateRule = vi.fn();
  const _mockRemoveRule = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Clear toast mocks
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    vi.mocked(showSuccess).mockClear();
    vi.mocked(showError).mockClear();

    // Hook-level mocking: All useMutation calls return the same mock
    // This is a limitation of mocking at the hook level - we can't distinguish
    // between create, update, and remove mutations since they're all called via useMutation()
    // Return mockUpdateRule for most cases since it's used most frequently
    (useMutation as any).mockReturnValue(mockUpdateRule);

    (useQuery as any).mockReturnValue([]);
  });

  describe("Empty State", () => {
    it("should show empty state message when no rules exist", () => {
      (useQuery as any).mockReturnValue([]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText(/No automation rules yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Create your first rule/i)).toBeInTheDocument();
    });

    it("should show Create Rule button", () => {
      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByRole("button", { name: /Create Rule/i })).toBeInTheDocument();
    });
  });

  describe("Dialog Display Logic", () => {
    it("should not show dialog initially", () => {
      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.queryByText(/Create Automation Rule/i)).not.toBeInTheDocument();
    });

    it("should show dialog when Create Rule clicked", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));

      expect(screen.getByText("Create Automation Rule")).toBeInTheDocument();
    });

    it("should close dialog when Cancel clicked", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      expect(screen.queryByText("Create Automation Rule")).not.toBeInTheDocument();
    });

    it("should reset form when opening create dialog", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      // Open dialog and fill form
      await user.click(screen.getByRole("button", { name: /Create Rule/i }));

      // Wait for dialog to be visible
      await waitFor(() => {
        expect(screen.getByText("Create Automation Rule")).toBeInTheDocument();
      });

      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "Old Name",
      );

      // Close dialog
      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      // Wait for dialog to close completely
      await waitFor(() => {
        expect(screen.queryByText("Create Automation Rule")).not.toBeInTheDocument();
      });

      // Reopen dialog
      await user.click(screen.getByRole("button", { name: /Create Rule/i }));

      // Wait for dialog to reopen with reset form
      await waitFor(() => {
        expect(screen.getByText("Create Automation Rule")).toBeInTheDocument();
      });

      // Form should be empty after reopening
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i)).toHaveValue(
          "",
        );
      });
    });
  });

  describe("Form Validation - Required Fields", () => {
    it("should reject save when name is empty", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      // Leave name empty, but fill label value
      await user.type(screen.getByPlaceholderText(/Enter label name/i), "urgent");

      // Get the submit button inside the dialog (the second one)
      const submitButtons = screen.getAllByRole("button", { name: /Create Rule/i });
      await user.click(submitButtons[submitButtons.length - 1]);

      expect(showError).toHaveBeenCalled();
      expect(mockUpdateRule).not.toHaveBeenCalled();
    });

    it("should reject save when actionValue is empty", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "Test Rule",
      );
      // Leave action value empty
      // Click the dialog's save button (exact match without the + prefix)
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      expect(showError).toHaveBeenCalled();
      expect(mockUpdateRule).not.toHaveBeenCalled();
    });

    it("should treat whitespace-only name as empty", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "   ",
      );
      await user.type(screen.getByPlaceholderText(/Enter label name/i), "urgent");
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      expect(showError).toHaveBeenCalled();
    });

    it("should treat whitespace-only actionValue as empty", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "Test Rule",
      );
      await user.type(screen.getByPlaceholderText(/Enter label name/i), "   ");
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      expect(showError).toHaveBeenCalled();
    });
  });

  describe("Typed Action Value Logic", () => {
    it("should accept valid label name", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      mockUpdateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "Test Rule",
      );
      await user.type(screen.getByPlaceholderText(/Enter label name/i), "urgent");
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalledWith(
          expect.objectContaining({
            actionValue: { type: "add_label", label: "urgent" },
          }),
        );
        expect(showError).not.toHaveBeenCalled();
      });
    });

    it("should reject invalid priority value", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      mockUpdateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "Test Rule",
      );

      // Change to set_priority action
      await user.selectOptions(screen.getByLabelText(/^Action/), "set_priority");

      // Enter invalid priority
      await user.type(screen.getByPlaceholderText(/lowest, low, medium, high/i), "invalid");
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      await waitFor(() => {
        expect(showError).toHaveBeenCalled();
        expect(mockUpdateRule).not.toHaveBeenCalled();
      });
    });

    it("should accept valid priority value", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      mockUpdateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "Test Rule",
      );

      // Change to set_priority action
      await user.selectOptions(screen.getByLabelText(/^Action/), "set_priority");

      await user.type(screen.getByPlaceholderText(/lowest, low, medium, high/i), "high");
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalledWith(
          expect.objectContaining({
            actionValue: { type: "set_priority", priority: "high" },
          }),
        );
      });
    });
  });

  describe("Whitespace Trimming Logic", () => {
    it("should trim name before sending", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      mockUpdateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "  Trimmed Name  ",
      );
      await user.type(screen.getByPlaceholderText(/Enter label name/i), "label");
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Trimmed Name",
          }),
        );
      });
    });

    it("should convert empty description to undefined", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      mockUpdateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "Test",
      );
      // Leave description empty
      await user.type(screen.getByPlaceholderText(/Enter label name/i), "label");
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalledWith(
          expect.objectContaining({
            description: undefined,
          }),
        );
      });
    });

    it("should convert whitespace-only description to undefined", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      mockUpdateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "Test",
      );
      await user.type(screen.getByPlaceholderText(/Optional description/i), "   ");
      await user.type(screen.getByPlaceholderText(/Enter label name/i), "label");
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalledWith(
          expect.objectContaining({
            description: undefined,
          }),
        );
      });
    });

    it("should convert empty triggerValue to undefined", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      mockUpdateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "Test",
      );
      // Leave trigger value empty
      await user.type(screen.getByPlaceholderText(/Enter label name/i), "label");
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalledWith(
          expect.objectContaining({
            triggerValue: undefined,
          }),
        );
      });
    });
  });

  describe("Edit Mode Behavior", () => {
    const existingRule = {
      _id: mockId<"automationRules">("rule1"),
      name: "Existing Rule",
      description: "A description",
      trigger: "priority_changed" as const,
      triggerValue: "high",
      actionType: "send_notification" as const,
      actionValue: {
        type: "send_notification",
        message: "High priority!",
      } as AutomationActionValue,
      isActive: true,
      executionCount: 10,
    };

    it("should populate form when Edit clicked", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([existingRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));

      expect(screen.getByDisplayValue("Existing Rule")).toBeInTheDocument();
      expect(screen.getByDisplayValue("A description")).toBeInTheDocument();
      expect(screen.getByDisplayValue("high")).toBeInTheDocument();
      expect(screen.getByDisplayValue("High priority!")).toBeInTheDocument();
    });

    it("should show 'Edit Automation Rule' title in edit mode", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([existingRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));

      expect(screen.getByText("Edit Automation Rule")).toBeInTheDocument();
    });

    it("should show 'Update Rule' button in edit mode", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([existingRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));

      expect(screen.getByRole("button", { name: /Update Rule/i })).toBeInTheDocument();
    });

    it("should preserve selected trigger and action type in edit mode", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([existingRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));

      const triggerSelect = screen.getByLabelText(/Trigger Event/i) as HTMLSelectElement;
      const actionSelect = screen.getByLabelText(/^Action/i) as HTMLSelectElement;

      expect(triggerSelect.value).toBe("priority_changed");
      expect(actionSelect.value).toBe("send_notification");
    });

    it("should call updateRule when saving in edit mode", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([existingRule]);
      mockUpdateRule.mockResolvedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));
      await user.click(screen.getByRole("button", { name: /Update Rule/i }));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalled();
      });
    });

    it("should handle missing description in edit mode", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const ruleWithoutDescription = { ...existingRule, description: undefined };
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([ruleWithoutDescription]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));

      expect(screen.getByPlaceholderText(/Optional description/i)).toHaveValue("");
    });

    it("should handle missing triggerValue in edit mode", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const ruleWithoutTriggerValue = { ...existingRule, triggerValue: undefined };
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([ruleWithoutTriggerValue]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));

      expect(screen.getByPlaceholderText(/Optional trigger condition/i)).toHaveValue("");
    });
  });

  describe("Rule Display & Formatting", () => {
    const activeRule = {
      _id: mockId<"automationRules">("rule1"),
      name: "Auto Label High Priority",
      description: "Adds urgent label to high priority items",
      trigger: "priority_changed" as const,
      triggerValue: "high",
      actionType: "add_label" as const,
      actionValue: { type: "add_label", label: "urgent" } as AutomationActionValue,
      isActive: true,
      executionCount: 42,
    };

    it("should display rule name", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText("Auto Label High Priority")).toBeInTheDocument();
    });

    it("should display rule description", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText("Adds urgent label to high priority items")).toBeInTheDocument();
    });

    it("should show Active badge when rule is active", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should show Inactive badge when rule is not active", () => {
      const inactiveRule = { ...activeRule, isActive: false };
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([inactiveRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });

    it("should display execution count", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText(/Executed: 42 times/i)).toBeInTheDocument();
    });

    it("should display trigger label correctly", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      // Trigger label is rendered in a Badge - use regex for flexible matching
      expect(screen.getByText(/Priority Changed/i)).toBeInTheDocument();
      // "high" appears in multiple places (rule name, trigger value), use getAllByText
      expect(screen.getAllByText(/high/i).length).toBeGreaterThan(0);
    });

    it("should display action label correctly", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.getByText("Add Label")).toBeInTheDocument();
    });

    it("should show trigger without arrow when no triggerValue", () => {
      const ruleWithoutValue = { ...activeRule, triggerValue: undefined };
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([ruleWithoutValue]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      expect(screen.queryByText(/→/)).not.toBeInTheDocument();
      expect(screen.getByText("Priority Changed")).toBeInTheDocument();
    });
  });

  describe("Toggle Active/Inactive Logic", () => {
    const activeRule = {
      _id: mockId<"automationRules">("rule1"),
      name: "Test Rule",
      trigger: "status_changed" as const,
      actionType: "add_label" as const,
      actionValue: { type: "add_label", label: "test" } as AutomationActionValue,
      isActive: true,
      executionCount: 0,
    };

    it("should show pause icon for active rules", () => {
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([activeRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      // Icon is rendered as SVG, check for aria-label instead
      expect(screen.getByRole("button", { name: /Disable rule/i })).toBeInTheDocument();
    });

    it("should show play icon for inactive rules", () => {
      const inactiveRule = { ...activeRule, isActive: false };
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([inactiveRule]);

      render(<AutomationRulesManager projectId={mockProjectId} />);

      // Icon is rendered as SVG, check for aria-label instead
      expect(screen.getByRole("button", { name: /Enable rule/i })).toBeInTheDocument();
    });

    it("should toggle active rule to inactive", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([activeRule]);
      mockUpdateRule.mockResolvedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Disable rule/i));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalledWith({
          id: "rule1",
          isActive: false,
        });
      });
    });

    it("should toggle inactive rule to active", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const inactiveRule = { ...activeRule, isActive: false };
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([inactiveRule]);
      mockUpdateRule.mockResolvedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Enable rule/i));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalledWith({
          id: "rule1",
          isActive: true,
        });
      });
    });

    it("should show success toast when disabling rule", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([activeRule]);
      mockUpdateRule.mockResolvedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Disable rule/i));

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Rule disabled");
      });
    });

    it("should show success toast when enabling rule", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const inactiveRule = { ...activeRule, isActive: false };
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([inactiveRule]);
      mockUpdateRule.mockResolvedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Enable rule/i));

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Rule enabled");
      });
    });
  });

  describe("Success & Error Handling", () => {
    it("should show success toast and close dialog after create", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      mockUpdateRule.mockResolvedValue({ _id: "rule1" });

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "Test",
      );
      await user.type(screen.getByPlaceholderText(/Enter label name/i), "label");
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Rule created");
        expect(screen.queryByText("Create Automation Rule")).not.toBeInTheDocument();
      });
    });

    it("should show success toast and close dialog after update", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const rule = {
        _id: mockId<"automationRules">("rule1"),
        name: "Test",
        trigger: "status_changed" as const,
        actionType: "add_label" as const,
        actionValue: { type: "add_label", label: "test" } as AutomationActionValue,
        isActive: true,
        executionCount: 0,
      };
      (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([rule]);
      mockUpdateRule.mockResolvedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByTitle(/Edit rule/i));
      await user.click(screen.getByRole("button", { name: /Update Rule/i }));

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Rule updated");
        expect(screen.queryByText("Edit Automation Rule")).not.toBeInTheDocument();
      });
    });

    it("should show error toast when create fails", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      mockUpdateRule.mockRejectedValue(new Error("Duplicate rule name"));

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "Test",
      );
      await user.type(screen.getByPlaceholderText(/Enter label name/i), "label");
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      await waitFor(() => {
        expect(showError).toHaveBeenCalled();
      });
    });

    it("should show generic error when error has no message", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      // Reject with a non-Error object to trigger the fallback message
      mockUpdateRule.mockRejectedValue({});

      render(<AutomationRulesManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Create Rule/i }));
      await user.type(
        screen.getByPlaceholderText(/e.g., Auto-assign high priority issues/i),
        "Test",
      );
      await user.type(screen.getByPlaceholderText(/Enter label name/i), "label");
      await user.click(screen.getByRole("button", { name: "Create Rule" }));

      await waitFor(() => {
        expect(showError).toHaveBeenCalled();
      });
    });
  });
});
