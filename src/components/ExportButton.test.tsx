import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { ExportButton } from "./ExportButton";

// Mock the ImportExportModal component
vi.mock("./ImportExportModal", () => ({
  ImportExportModal: vi.fn(({ open, onOpenChange, projectId }) => {
    if (!open) return null;
    return (
      <div data-testid="import-export-modal">
        <button type="button" onClick={() => onOpenChange(false)}>
          Close Modal
        </button>
        <div data-testid="modal-project-id">{projectId}</div>
      </div>
    );
  }),
}));

describe("ExportButton", () => {
  const mockProjectId = "project-123" as Id<"projects">;

  it("should render import/export button", () => {
    render(<ExportButton projectId={mockProjectId} />);

    expect(screen.getByRole("button", { name: /Import \/ Export/i })).toBeInTheDocument();
  });

  it("should not show modal initially", () => {
    render(<ExportButton projectId={mockProjectId} />);

    expect(screen.queryByTestId("import-export-modal")).not.toBeInTheDocument();
  });

  it("should open modal when button is clicked", async () => {
    const user = userEvent.setup();
    render(<ExportButton projectId={mockProjectId} />);

    const button = screen.getByRole("button", { name: /Import \/ Export/i });
    await user.click(button);

    expect(screen.getByTestId("import-export-modal")).toBeInTheDocument();
  });

  it("should close modal when onClose is called", async () => {
    const user = userEvent.setup();
    render(<ExportButton projectId={mockProjectId} />);

    // Open modal
    const button = screen.getByRole("button", { name: /Import \/ Export/i });
    await user.click(button);

    expect(screen.getByTestId("import-export-modal")).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByRole("button", { name: /Close Modal/i });
    await user.click(closeButton);

    expect(screen.queryByTestId("import-export-modal")).not.toBeInTheDocument();
  });

  it("should pass projectId to modal", async () => {
    const user = userEvent.setup();
    render(<ExportButton projectId={mockProjectId} />);

    const button = screen.getByRole("button", { name: /Import \/ Export/i });
    await user.click(button);

    expect(screen.getByTestId("modal-project-id")).toHaveTextContent(mockProjectId);
  });

  it("should display icon", () => {
    render(<ExportButton projectId={mockProjectId} />);

    const button = screen.getByRole("button", { name: /Import \/ Export/i });
    const svg = button.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("should have correct styling classes from Button component", () => {
    render(<ExportButton projectId={mockProjectId} />);

    const button = screen.getByRole("button", { name: /Import \/ Export/i });

    // Uses Button component with secondary variant
    expect(button).toHaveClass("inline-flex", "items-center", "gap-2");
  });

  it("should be type button", () => {
    render(<ExportButton projectId={mockProjectId} />);

    const button = screen.getByRole("button", { name: /Import \/ Export/i });

    expect(button).toHaveAttribute("type", "button");
  });

  it("should maintain modal state between renders", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ExportButton projectId={mockProjectId} />);

    // Open modal
    const button = screen.getByRole("button", { name: /Import \/ Export/i });
    await user.click(button);

    expect(screen.getByTestId("import-export-modal")).toBeInTheDocument();

    // Rerender with same props
    rerender(<ExportButton projectId={mockProjectId} />);

    expect(screen.getByTestId("import-export-modal")).toBeInTheDocument();
  });

  it("should work with different projectIds", async () => {
    const user = userEvent.setup();
    const differentProjectId = "project-456" as Id<"projects">;
    const { rerender } = render(<ExportButton projectId={mockProjectId} />);

    // Open modal with first project
    let button = screen.getByRole("button", { name: /Import \/ Export/i });
    await user.click(button);

    expect(screen.getByTestId("modal-project-id")).toHaveTextContent(mockProjectId);

    // Close modal
    const closeButton = screen.getByRole("button", { name: /Close Modal/i });
    await user.click(closeButton);

    // Rerender with different project
    rerender(<ExportButton projectId={differentProjectId} />);

    // Open modal again
    button = screen.getByRole("button", { name: /Import \/ Export/i });
    await user.click(button);

    expect(screen.getByTestId("modal-project-id")).toHaveTextContent(differentProjectId);
  });
});
