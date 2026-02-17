import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { showError, showSuccess } from "@/lib/toast";
import { fireEvent, render, waitFor } from "@/test/custom-render";
import { FileAttachments } from "./FileAttachments";

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

// Mock icons
vi.mock("@/lib/icons", () => ({
  Archive: () => <div data-testid="icon-archive" />,
  FileImage: () => <div data-testid="icon-image" />,
  FileSpreadsheet: () => <div data-testid="icon-spreadsheet" />,
  FileText: () => <div data-testid="icon-text" />,
  Paperclip: () => <div data-testid="icon-paperclip" />,
}));

// Mock api object (partially)
vi.mock("@convex/_generated/api", () => ({
  api: {
    files: {
      getIssueAttachments: "getIssueAttachments",
      generateUploadUrl: "generateUploadUrl",
      addAttachment: "addAttachment",
      removeAttachment: "removeAttachment",
    },
  },
}));

describe("FileAttachments Upload", () => {
  const issueId = "issue-123" as Id<"issues">;

  const mockGenerateUploadUrl = vi.fn();
  const mockAddAttachment = vi.fn();
  const mockRemoveAttachment = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useQuery
    vi.mocked(useQuery).mockReturnValue([]);

    // Mock useMutation implementation to return specific mocks based on the "function reference"
    // Since we mocked api.files.* as strings, we can check for those strings.
    vi.mocked(useMutation).mockImplementation((fn: any) => {
      const mock = (() => {
        if (fn === "generateUploadUrl") return mockGenerateUploadUrl;
        if (fn === "addAttachment") return mockAddAttachment;
        if (fn === "removeAttachment") return mockRemoveAttachment;
        return vi.fn();
      })();

      // Cast to match ReactMutation interface, ensuring withOptimisticUpdate exists
      return Object.assign(mock, {
        withOptimisticUpdate: vi.fn(),
      }) as any;
    });

    mockGenerateUploadUrl.mockResolvedValue("https://upload.example.com");
    mockAddAttachment.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle multiple file uploads and continue if one fails", async () => {
    // Setup fetch mock
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    // File 1: Success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ storageId: "storage-1" }),
    });

    // File 2: Failure (simulated fetch error)
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
    });

    // File 3: Success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ storageId: "storage-3" }),
    });

    render(<FileAttachments issueId={issueId} />);

    // Trigger upload
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Create File objects
    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });
    const file3 = new File(["content3"], "file3.txt", { type: "text/plain" });

    // Simulate file selection
    fireEvent.change(input, { target: { files: [file1, file2, file3] } });

    // Wait for generateUploadUrl to be called 3 times (since we have 3 files)
    // NOTE: In current implementation (serial), it stops after the 2nd file fails.
    // In new implementation (parallel), it calls 3 times.

    // We expect the test to FAIL initially (or pass partially if error handling is weak).
    // But since I'm implementing the fix, I expect this test to pass eventually.

    // Wait for sufficient time or condition
    await waitFor(() => expect(mockGenerateUploadUrl).toHaveBeenCalledTimes(3));

    // Check addAttachment calls
    // Expect 2 calls (file1 and file3)
    await waitFor(() => expect(mockAddAttachment).toHaveBeenCalledTimes(2));

    expect(mockAddAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ filename: "file1.txt" }),
    );
    expect(mockAddAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ filename: "file3.txt" }),
    );

    // Check toast messages
    expect(showSuccess).toHaveBeenCalledWith("Uploaded file1.txt");
    expect(showSuccess).toHaveBeenCalledWith("Uploaded file3.txt");
    expect(showError).toHaveBeenCalledWith(expect.any(Error), "Failed to upload file2.txt");
  });
});
