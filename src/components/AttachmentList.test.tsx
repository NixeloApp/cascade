import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { AttachmentList } from "./AttachmentList";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock toast
vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe("AttachmentList", () => {
  const mockRemoveAttachment = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as Mock & ReactMutation<FunctionReference<"mutation">>;
  const issueId = "issue-123" as Id<"issues">;
  const attachmentIds = ["storage-1", "storage-2"] as Id<"_storage">[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMutation).mockReturnValue(
      mockRemoveAttachment as ReactMutation<FunctionReference<"mutation">>,
    );

    // Loose mock for useQuery to ensure it returns data
    vi.mocked(useQuery).mockImplementation((...args) => {
      const qArgs = args[1];
      if (qArgs === "skip" || !qArgs) return undefined;
      const storageId = (qArgs as Record<string, unknown>).storageId;
      if (storageId === "storage-1") return "https://example.com/file1.png";
      if (storageId === "storage-2") return "https://example.com/document.pdf";
      return undefined;
    });

    // Mock confirm dialog
    global.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render nothing when attachmentIds is empty", () => {
    const { container } = render(<AttachmentList attachmentIds={[]} issueId={issueId} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should render list of attachments", () => {
    render(<AttachmentList attachmentIds={attachmentIds} issueId={issueId} />);

    expect(screen.getByText("Attachments (2)")).toBeInTheDocument();
    expect(screen.getByText("file1.png")).toBeInTheDocument();
    expect(screen.getByText("document.pdf")).toBeInTheDocument();
  });

  it("should show tooltips for actions", async () => {
    // Just verify existence of triggers
    render(
      <AttachmentList
        attachmentIds={["storage-1" as Id<"_storage">]}
        issueId={issueId}
        canEdit={true}
      />,
    );

    // Check Download tooltip trigger
    const downloadLink = screen.getByRole("link", { name: "Download attachment" });
    expect(downloadLink).toBeInTheDocument();

    // Check Remove tooltip trigger
    const removeButton = screen.getByRole("button", { name: "Remove attachment" });
    expect(removeButton).toBeInTheDocument();
  });

  it("should handle attachment removal", async () => {
    const user = userEvent.setup();
    mockRemoveAttachment.mockResolvedValue(undefined);

    render(
      <AttachmentList
        attachmentIds={["storage-1" as Id<"_storage">]}
        issueId={issueId}
        canEdit={true}
      />,
    );

    const removeButton = screen.getByRole("button", { name: "Remove attachment" });
    await user.click(removeButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockRemoveAttachment).toHaveBeenCalledWith({
      issueId,
      storageId: "storage-1",
    });
  });

  it("should not show remove button if canEdit is false", () => {
    render(
      <AttachmentList
        attachmentIds={["storage-1" as Id<"_storage">]}
        issueId={issueId}
        canEdit={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Remove attachment" })).not.toBeInTheDocument();
  });

  it("should display loading state when url is not yet loaded", () => {
    vi.mocked(useQuery).mockReturnValue(undefined); // simulate loading

    render(<AttachmentList attachmentIds={["storage-1" as Id<"_storage">]} issueId={issueId} />);

    // Check for skeletons/loading indicators (Skeleton uses animate-shimmer)
    const skeletons = document.querySelectorAll(".animate-shimmer");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
