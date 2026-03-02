import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { TemplateCard } from "./TemplateCard";

// Mock template data
function createMockTemplate(overrides = {}) {
  return {
    _id: "template-1" as Id<"issueTemplates">,
    name: "Bug Report",
    type: "bug" as const,
    titleTemplate: "[BUG] {description}",
    descriptionTemplate: "## Steps to Reproduce\n1. \n\n## Expected Result",
    defaultPriority: "high" as const,
    defaultLabels: ["bug", "frontend"],
    defaultStoryPoints: 3,
    isDefault: false,
    ...overrides,
  };
}

describe("TemplateCard", () => {
  const defaultProps = {
    template: createMockTemplate(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  describe("Rendering", () => {
    it("should render template name", () => {
      render(<TemplateCard {...defaultProps} />);

      expect(screen.getByText("Bug Report")).toBeInTheDocument();
    });

    it("should render template type badge", () => {
      render(<TemplateCard {...defaultProps} />);

      // "bug" appears twice - once as type badge and once as default label
      const bugBadges = screen.getAllByText("bug");
      expect(bugBadges.length).toBeGreaterThanOrEqual(1);
    });

    it("should render template priority badge", () => {
      render(<TemplateCard {...defaultProps} />);

      expect(screen.getByText("high")).toBeInTheDocument();
    });

    it("should render title template with label", () => {
      render(<TemplateCard {...defaultProps} />);

      expect(screen.getByText("Title:")).toBeInTheDocument();
      expect(screen.getByText(/\[BUG\] \{description\}/)).toBeInTheDocument();
    });

    it("should render description template when provided", () => {
      render(<TemplateCard {...defaultProps} />);

      expect(screen.getByText(/Steps to Reproduce/)).toBeInTheDocument();
    });

    it("should render story points badge when provided", () => {
      render(<TemplateCard {...defaultProps} />);

      expect(screen.getByText("3 pts")).toBeInTheDocument();
    });

    it("should render default labels as badges", () => {
      render(<TemplateCard {...defaultProps} />);

      // "bug" appears as both type badge and label, frontend only as label
      expect(screen.getAllByText("bug").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("frontend")).toBeInTheDocument();
    });

    it("should not render story points when not provided", () => {
      const template = createMockTemplate({ defaultStoryPoints: undefined });

      render(<TemplateCard {...defaultProps} template={template} />);

      expect(screen.queryByText(/pts$/)).not.toBeInTheDocument();
    });

    it("should not render labels when not provided", () => {
      const template = createMockTemplate({ defaultLabels: undefined });

      render(<TemplateCard {...defaultProps} template={template} />);

      // Only the type badge 'bug' should exist, not as a label
      const bugBadges = screen.getAllByText("bug");
      expect(bugBadges).toHaveLength(1); // Just the type badge
    });
  });

  describe("Default Template", () => {
    it("should render Default badge when isDefault is true", () => {
      const template = createMockTemplate({ isDefault: true });

      render(<TemplateCard {...defaultProps} template={template} />);

      expect(screen.getByText("Default")).toBeInTheDocument();
    });

    it("should not render Default badge when isDefault is false", () => {
      render(<TemplateCard {...defaultProps} />);

      expect(screen.queryByText("Default")).not.toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("should render Edit button", () => {
      render(<TemplateCard {...defaultProps} />);

      expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
    });

    it("should render Delete button", () => {
      render(<TemplateCard {...defaultProps} />);

      expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
    });

    it("should call onEdit when Edit button is clicked", async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(<TemplateCard {...defaultProps} onEdit={onEdit} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it("should call onDelete when Delete button is clicked", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(<TemplateCard {...defaultProps} onDelete={onDelete} />);

      await user.click(screen.getByRole("button", { name: /Delete/i }));

      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Different Issue Types", () => {
    it("should render task type correctly", () => {
      const template = createMockTemplate({ type: "task" as const });

      render(<TemplateCard {...defaultProps} template={template} />);

      expect(screen.getByText("task")).toBeInTheDocument();
    });

    it("should render story type correctly", () => {
      const template = createMockTemplate({ type: "story" as const });

      render(<TemplateCard {...defaultProps} template={template} />);

      expect(screen.getByText("story")).toBeInTheDocument();
    });

    it("should render epic type correctly", () => {
      const template = createMockTemplate({ type: "epic" as const });

      render(<TemplateCard {...defaultProps} template={template} />);

      expect(screen.getByText("epic")).toBeInTheDocument();
    });
  });
});
