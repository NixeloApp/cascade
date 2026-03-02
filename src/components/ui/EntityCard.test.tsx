import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { EntityCard } from "./EntityCard";

describe("EntityCard", () => {
  describe("Rendering", () => {
    it("should render title", () => {
      render(<EntityCard title="Test Entity" />);

      expect(screen.getByText("Test Entity")).toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(<EntityCard title="Test Entity" description="This is a description" />);

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("should not render description when not provided", () => {
      render(<EntityCard title="Test Entity" />);

      expect(screen.queryByText("This is a description")).not.toBeInTheDocument();
    });

    it("should render children when provided", () => {
      render(
        <EntityCard title="Test Entity">
          <div data-testid="child-content">Child content</div>
        </EntityCard>,
      );

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("should render badge when provided", () => {
      render(<EntityCard title="Test Entity" badge={<span data-testid="badge">Active</span>} />);

      expect(screen.getByTestId("badge")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("should render Edit button when onEdit is provided", () => {
      const onEdit = vi.fn();
      render(<EntityCard title="Test Entity" onEdit={onEdit} />);

      expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
    });

    it("should call onEdit when Edit button is clicked", async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<EntityCard title="Test Entity" onEdit={onEdit} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it("should render Delete button when onDelete is provided", () => {
      const onDelete = vi.fn();
      render(<EntityCard title="Test Entity" onDelete={onDelete} />);

      expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
    });

    it("should call onDelete when Delete button is clicked", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<EntityCard title="Test Entity" onDelete={onDelete} />);

      await user.click(screen.getByRole("button", { name: /Delete/i }));

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("should render both Edit and Delete buttons when both handlers are provided", () => {
      render(<EntityCard title="Test Entity" onEdit={vi.fn()} onDelete={vi.fn()} />);

      expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
    });

    it("should not render Edit button when onEdit is not provided", () => {
      render(<EntityCard title="Test Entity" onDelete={vi.fn()} />);

      expect(screen.queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
    });

    it("should not render Delete button when onDelete is not provided", () => {
      render(<EntityCard title="Test Entity" onEdit={vi.fn()} />);

      expect(screen.queryByRole("button", { name: /Delete/i })).not.toBeInTheDocument();
    });
  });

  describe("Custom Actions", () => {
    it("should render custom actions instead of default buttons", () => {
      render(
        <EntityCard
          title="Test Entity"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          actions={
            <button type="button" data-testid="custom-action">
              Custom Action
            </button>
          }
        />,
      );

      expect(screen.getByTestId("custom-action")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Delete/i })).not.toBeInTheDocument();
    });
  });
});
