import { act, renderHook, waitFor } from "@testing-library/react";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFileUpload } from "./useFileUpload";

// Mock Convex
vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock toast
vi.mock("../lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { useMutation } from "convex/react";
import { showError, showSuccess } from "../lib/toast";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useFileUpload", () => {
  let mockGenerateUploadUrl: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateUploadUrl = vi.fn().mockResolvedValue("https://upload.example.com/url");
    (useMutation as Mock).mockReturnValue(mockGenerateUploadUrl);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ storageId: "storage-123" }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("should not be uploading initially", () => {
      const { result } = renderHook(() => useFileUpload());
      expect(result.current.isUploading).toBe(false);
    });

    it("should provide a file input ref", () => {
      const { result } = renderHook(() => useFileUpload());
      expect(result.current.fileInputRef).toBeDefined();
      expect(result.current.fileInputRef.current).toBeNull();
    });

    it("should provide handler functions", () => {
      const { result } = renderHook(() => useFileUpload());
      expect(typeof result.current.handleFileSelect).toBe("function");
      expect(typeof result.current.openFilePicker).toBe("function");
      expect(typeof result.current.reset).toBe("function");
    });
  });

  describe("file validation", () => {
    it("should reject files exceeding max size", async () => {
      const { result } = renderHook(() =>
        useFileUpload({ maxSize: 1024 }), // 1KB limit
      );

      const largeFile = new File(["x".repeat(2048)], "large.txt", { type: "text/plain" });
      const event = {
        target: { files: [largeFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(showError).toHaveBeenCalledWith(expect.stringContaining("too large"));
      expect(mockGenerateUploadUrl).not.toHaveBeenCalled();
    });

    it("should reject files with disallowed types", async () => {
      const { result } = renderHook(() =>
        useFileUpload({ allowedTypes: ["image/png", "image/jpeg"] }),
      );

      const htmlFile = new File(["<html></html>"], "page.html", { type: "text/html" });
      const event = {
        target: { files: [htmlFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(showError).toHaveBeenCalledWith("File type not supported.");
      expect(mockGenerateUploadUrl).not.toHaveBeenCalled();
    });

    it("should accept files within size limit", async () => {
      const { result } = renderHook(() => useFileUpload({ maxSize: 1024 * 1024 }));

      const smallFile = new File(["small content"], "small.txt", { type: "text/plain" });
      const event = {
        target: { files: [smallFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(mockGenerateUploadUrl).toHaveBeenCalled();
    });

    it("should accept files with allowed types", async () => {
      const { result } = renderHook(() =>
        useFileUpload({ allowedTypes: ["image/png"] }),
      );

      const pngFile = new File(["fake png"], "image.png", { type: "image/png" });
      const event = {
        target: { files: [pngFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(mockGenerateUploadUrl).toHaveBeenCalled();
    });

    it("should skip validation when no file is selected", async () => {
      const { result } = renderHook(() => useFileUpload());

      const event = {
        target: { files: [] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(mockGenerateUploadUrl).not.toHaveBeenCalled();
      expect(showError).not.toHaveBeenCalled();
    });
  });

  describe("successful upload", () => {
    it("should set isUploading during upload", async () => {
      let resolveUpload: () => void;
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpload = () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ storageId: "storage-123" }),
              });
          }),
      );

      const { result } = renderHook(() => useFileUpload());

      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      let uploadPromise: Promise<void>;
      act(() => {
        uploadPromise = result.current.handleFileSelect(event);
      });

      // Should be uploading
      await waitFor(() => {
        expect(result.current.isUploading).toBe(true);
      });

      // Resolve upload
      await act(async () => {
        resolveUpload!();
        await uploadPromise;
      });

      expect(result.current.isUploading).toBe(false);
    });

    it("should call onSuccess with storageId and file", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useFileUpload({ onSuccess }));

      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(onSuccess).toHaveBeenCalledWith("storage-123", file);
    });

    it("should show success message with filename", async () => {
      const { result } = renderHook(() => useFileUpload());

      const file = new File(["content"], "report.pdf", { type: "application/pdf" });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(showSuccess).toHaveBeenCalledWith(
        expect.stringContaining("report.pdf"),
      );
    });

    it("should use custom success message", async () => {
      const { result } = renderHook(() =>
        useFileUpload({ successMessage: "Uploaded: {filename}" }),
      );

      const file = new File(["content"], "doc.pdf", { type: "application/pdf" });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(showSuccess).toHaveBeenCalledWith("Uploaded: doc.pdf");
    });

    it("should upload to the generated URL", async () => {
      mockGenerateUploadUrl.mockResolvedValue("https://custom-upload.com/path");
      const { result } = renderHook(() => useFileUpload());

      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://custom-upload.com/path",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: file,
        }),
      );
    });
  });

  describe("failed upload", () => {
    it("should show error when upload URL generation fails", async () => {
      mockGenerateUploadUrl.mockRejectedValue(new Error("URL generation failed"));
      const { result } = renderHook(() => useFileUpload());

      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(showError).toHaveBeenCalledWith(expect.any(Error), "Failed to upload file");
    });

    it("should show error when fetch fails", async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const { result } = renderHook(() => useFileUpload());

      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(showError).toHaveBeenCalled();
    });

    it("should call onError callback", async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const onError = vi.fn();
      const { result } = renderHook(() => useFileUpload({ onError }));

      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(onError).toHaveBeenCalled();
    });

    it("should use custom error message", async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const { result } = renderHook(() =>
        useFileUpload({ errorMessage: "Custom upload error" }),
      );

      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(showError).toHaveBeenCalledWith(expect.any(Error), "Custom upload error");
    });

    it("should set isUploading to false after error", async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const { result } = renderHook(() => useFileUpload());

      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        await result.current.handleFileSelect(event);
      });

      expect(result.current.isUploading).toBe(false);
    });
  });

  describe("openFilePicker", () => {
    it("should trigger click on file input", () => {
      const { result } = renderHook(() => useFileUpload());

      // Create a mock input element
      const mockInput = { click: vi.fn() };
      Object.defineProperty(result.current.fileInputRef, "current", {
        get: () => mockInput,
      });

      act(() => {
        result.current.openFilePicker();
      });

      expect(mockInput.click).toHaveBeenCalled();
    });
  });

  describe("reset", () => {
    it("should clear the file input value", () => {
      const { result } = renderHook(() => useFileUpload());

      // Create a mock input element
      const mockInput = { value: "test.txt" };
      Object.defineProperty(result.current.fileInputRef, "current", {
        get: () => mockInput,
      });

      act(() => {
        result.current.reset();
      });

      expect(mockInput.value).toBe("");
    });
  });
});
