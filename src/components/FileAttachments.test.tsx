import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { FileAttachments } from "./FileAttachments";
import { Typography } from "./ui/Typography";

interface Attachment {
  storageId: Id<"_storage">;
  filename: string;
  url: string | null;
  uploadedAt: number;
  uploadedBy?: Id<"users">;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  title: string;
}

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

// Mock confirm dialog
vi.mock("@/components/ui/ConfirmDialog", () => ({
  ConfirmDialog: ({ isOpen, onConfirm, title }: ConfirmDialogProps) =>
    isOpen ? (
      <div role="dialog">
        <Typography variant="h4">{title}</Typography>
        <button type="button" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    ) : null,
}));

describe("FileAttachments", () => {
  const _mockAddAttachment = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as ReactMutation<FunctionReference<"mutation">>;
  const mockRemoveAttachment = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as ReactMutation<FunctionReference<"mutation">>;
  const _mockGenerateUploadUrl = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as ReactMutation<FunctionReference<"mutation">>;
  const issueId = "issue-123" as Id<"issues">;

  const mockAttachments = [
    {
      storageId: "storage-1" as Id<"_storage">,
      filename: "test-image.png",
      url: "https://example.com/test-image.png",
      uploadedAt: Date.now(),
      uploadedBy: "user-1" as Id<"users">,
    },
    {
      storageId: "storage-2" as Id<"_storage">,
      filename: "document.pdf",
      url: "https://example.com/document.pdf",
      uploadedAt: Date.now(),
      uploadedBy: "user-1" as Id<"users">,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMutation).mockImplementation(() => {
      // We can't easily check the function reference here without importing api,
      // but for this unit test it's fine to return generic mocks or specific ones if needed.
      return mockRemoveAttachment;
    });

    vi.mocked(useQuery).mockReturnValue(mockAttachments);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render list of attachments", () => {
    render(<FileAttachments issueId={issueId} />);

    expect(screen.getByText("Attachments (2)")).toBeInTheDocument();
    expect(screen.getByText("test-image.png")).toBeInTheDocument();
    expect(screen.getByText("document.pdf")).toBeInTheDocument();
  });

  it("should render download and delete actions", () => {
    render(<FileAttachments issueId={issueId} />);

    // Check Download links
    // They should be accessible by their accessible name (from sr-only span)
    expect(screen.getByRole("link", { name: "Download test-image.png" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download document.pdf" })).toBeInTheDocument();

    // Check Delete buttons
    // They should be accessible by unique aria-label per file
    expect(screen.getByRole("button", { name: "Delete test-image.png" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete document.pdf" })).toBeInTheDocument();
  });
});
