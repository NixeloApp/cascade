import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { MarkdownPreviewModal } from "./MarkdownPreviewModal";

describe("MarkdownPreviewModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    markdown: "# Test Heading\n\nParagraph content.",
    filename: "test-document.md",
  };

  it("should render when open", () => {
    render(<MarkdownPreviewModal {...defaultProps} />);

    expect(screen.getByText("Preview Markdown Import")).toBeInTheDocument();
    expect(screen.getByText(/test-document.md/)).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(<MarkdownPreviewModal {...defaultProps} open={false} />);

    expect(screen.queryByText("Preview Markdown Import")).not.toBeInTheDocument();
  });

  it("should display file statistics", () => {
    const markdown = `# Heading 1
## Heading 2

- List item 1
- List item 2
- List item 3

\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`python
print("hello")
\`\`\``;

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    // Should show statistics
    expect(screen.getByText(/2 headings/)).toBeInTheDocument();
    expect(screen.getByText(/3 lists/)).toBeInTheDocument();
    expect(screen.getByText(/2 code blocks/)).toBeInTheDocument();
  });

  it("should show warning about content replacement", () => {
    render(<MarkdownPreviewModal {...defaultProps} />);

    expect(screen.getByText(/This will replace all current document content/)).toBeInTheDocument();
    expect(
      screen.getByText(/Make sure you have a backup or export the current version first/),
    ).toBeInTheDocument();
  });

  it("should switch between Preview and Raw tabs", async () => {
    const user = userEvent.setup();
    render(<MarkdownPreviewModal {...defaultProps} />);

    // Click Raw tab
    const rawTab = screen.getByRole("tab", { name: "Raw Markdown" });
    await user.click(rawTab);

    // Raw tab should now be active (Radix tabs use data-state attribute)
    expect(rawTab).toHaveAttribute("data-state", "active");
  });

  it("should display raw markdown in Raw tab", async () => {
    const user = userEvent.setup();
    const markdown = "# Test\n\nContent here.";

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    // Switch to Raw tab
    await user.click(screen.getByText("Raw Markdown"));

    // Should display raw markdown - check for the markdown text
    expect(screen.getByText(/# Test/)).toBeInTheDocument();
  });

  it("should call onConfirm when import button clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<MarkdownPreviewModal {...defaultProps} onConfirm={onConfirm} />);

    const importButton = screen.getByText("Import & Replace Content");
    await user.click(importButton);

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("should call onOpenChange(false) when cancel button clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<MarkdownPreviewModal {...defaultProps} onOpenChange={onOpenChange} />);

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should calculate correct line count", () => {
    const markdown = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    expect(screen.getByText(/5 lines/)).toBeInTheDocument();
  });

  it("should handle markdown without headings", () => {
    const markdown = "Just plain text\n\nNo headings here.";

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    expect(screen.getByText(/0 headings/)).toBeInTheDocument();
  });

  it("should handle markdown without lists", () => {
    const markdown = "# Heading\n\nJust paragraphs.";

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    expect(screen.getByText(/0 lists/)).toBeInTheDocument();
  });

  it("should handle markdown without code blocks", () => {
    const markdown = "# Heading\n\nNo code here.";

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    expect(screen.getByText(/0 code blocks/)).toBeInTheDocument();
  });

  it("should display filename", () => {
    render(<MarkdownPreviewModal {...defaultProps} filename="my-doc.md" />);

    expect(screen.getByText(/my-doc.md/)).toBeInTheDocument();
  });
});
