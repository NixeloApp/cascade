import { render, screen } from "@/test/custom-render";
import { describe, expect, it, vi } from "vitest";
import { IssueDetailHeader } from "./IssueDetailHeader";
import userEvent from "@testing-library/user-event";

// Mock Tooltip to verify content
vi.mock("@/components/ui/Tooltip", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui/Tooltip")>();
  return {
    ...actual,
    Tooltip: ({ children, content }: { children: React.ReactNode; content: string }) => (
      <div data-testid="tooltip-wrapper" data-tooltip-content={content}>
        {children}
      </div>
    ),
  };
});

describe("IssueDetailHeader", () => {
  const defaultProps = {
    issueKey: "TEST-123",
    issueType: "task" as const,
    hasCopied: false,
    onCopyKey: vi.fn(),
  };

  it("renders issue key correctly", () => {
    render(<IssueDetailHeader {...defaultProps} />);
    expect(screen.getByText("TEST-123")).toBeInTheDocument();
  });

  it("renders copy button with accessible name", () => {
    render(<IssueDetailHeader {...defaultProps} />);
    const copyButton = screen.getByRole("button", { name: /Copy issue key/i });
    expect(copyButton).toBeInTheDocument();
  });

  it("shows 'Copied!' tooltip when copied", () => {
    render(<IssueDetailHeader {...defaultProps} hasCopied={true} />);
    const wrapper = screen.getByTestId("tooltip-wrapper");
    expect(wrapper).toHaveAttribute("data-tooltip-content", "Copied!");
  });
});
