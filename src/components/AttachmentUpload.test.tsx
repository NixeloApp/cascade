import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/custom-render";

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
import { showError } from "@/lib/toast";
import { AttachmentUpload } from "./AttachmentUpload";

describe("AttachmentUpload", () => {
  const issueId = "issue-123" as Id<"issues">;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Attach File button", () => {
    render(<AttachmentUpload issueId={issueId} />);

    const button = screen.getByRole("button", { name: /attach file/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("renders a hidden file input with correct accept types", () => {
    const { container } = render(<AttachmentUpload issueId={issueId} />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.accept).toContain("image/jpeg");
    expect(fileInput.accept).toContain("application/pdf");
    expect(fileInput.className).toContain("hidden");
  });

  it("shows error for unsupported file type", () => {
    const { container } = render(<AttachmentUpload issueId={issueId} />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(["exe content"], "malware.exe", { type: "application/x-msdownload" });
    // Use fireEvent directly to bypass accept attribute filtering in userEvent
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(showError).toHaveBeenCalledWith(
      "File type not supported. Please upload images, PDFs, text files, or zips.",
    );
  });

  it("shows error for oversized files", () => {
    const { container } = render(<AttachmentUpload issueId={issueId} />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    // Create a file larger than 10MB
    const largeContent = new ArrayBuffer(11 * 1024 * 1024);
    const file = new File([largeContent], "huge.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(showError).toHaveBeenCalledWith("File is too large. Maximum size is 10MB.");
  });
});
