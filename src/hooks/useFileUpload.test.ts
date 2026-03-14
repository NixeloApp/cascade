import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { act, renderHook, waitFor } from "@/test/custom-render";
import { useFileUpload } from "./useFileUpload";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

const generateUploadUrl = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const fetchMock = vi.fn<typeof fetch>();

const MAX_FILE_SIZE = 1024;
const OVERSIZED_FILE_BYTES = 2 * MAX_FILE_SIZE;
const CUSTOM_ERROR_MESSAGE = "Upload failed for attachment";
const UPLOAD_URL = "https://upload.test/storage";
const STORAGE_ID = "storage_1" as Id<"_storage">;

function attachInputRef(ref: React.RefObject<HTMLInputElement | null>) {
  const input = document.createElement("input");
  Object.defineProperty(input, "value", {
    configurable: true,
    writable: true,
    value: "selected",
  });
  Object.defineProperty(ref, "current", {
    configurable: true,
    value: input,
  });
  return input;
}

function createChangeEvent(file?: File): React.ChangeEvent<HTMLInputElement> {
  const input = document.createElement("input");
  Object.defineProperty(input, "files", {
    configurable: true,
    value: file ? [file] : [],
  });
  return { target: input } as React.ChangeEvent<HTMLInputElement>;
}

describe("useFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: generateUploadUrl,
      canAct: true,
      isAuthLoading: false,
    });
    generateUploadUrl.mockResolvedValue(UPLOAD_URL);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ storageId: STORAGE_ID }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);
  });

  it("rejects files that exceed the configured size limit", async () => {
    const oversizedFile = new File(["x".repeat(OVERSIZED_FILE_BYTES)], "large.pdf", {
      type: "application/pdf",
    });

    const { result } = renderHook(() =>
      useFileUpload({
        maxSize: MAX_FILE_SIZE,
      }),
    );

    await act(async () => {
      await result.current.handleFileSelect(createChangeEvent(oversizedFile));
    });

    expect(mockShowError).toHaveBeenCalledWith("File is too large. Maximum size is 0MB.");
    expect(generateUploadUrl).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.isUploading).toBe(false);
  });

  it("rejects unsupported file types before uploading", async () => {
    const textFile = new File(["hello"], "notes.txt", { type: "text/plain" });

    const { result } = renderHook(() =>
      useFileUpload({
        allowedTypes: ["application/pdf"],
      }),
    );

    await act(async () => {
      await result.current.handleFileSelect(createChangeEvent(textFile));
    });

    expect(mockShowError).toHaveBeenCalledWith("File type not supported.");
    expect(generateUploadUrl).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uploads valid files, triggers success callbacks, and resets the input", async () => {
    const imageFile = new File(["image"], "avatar.png", { type: "image/png" });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useFileUpload({
        onSuccess,
      }),
    );

    const input = attachInputRef(result.current.fileInputRef);
    const clickSpy = vi.spyOn(input, "click");

    act(() => {
      result.current.openFilePicker();
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);

    let uploadPromise!: Promise<void>;
    act(() => {
      uploadPromise = result.current.handleFileSelect(createChangeEvent(imageFile));
    });

    expect(result.current.isUploading).toBe(true);

    await act(async () => {
      await uploadPromise;
    });

    expect(generateUploadUrl).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: imageFile,
    });
    expect(onSuccess).toHaveBeenCalledWith(STORAGE_ID, imageFile);
    expect(mockShowSuccess).toHaveBeenCalledWith('File "avatar.png" uploaded successfully');
    expect(input.value).toBe("");
    expect(result.current.isUploading).toBe(false);
  });

  it("reports upload failures through toast and error callback", async () => {
    const file = new File(["payload"], "data.json", { type: "application/json" });
    const onError = vi.fn();
    const error = new Error("network down");

    generateUploadUrl.mockRejectedValueOnce(error);

    const { result } = renderHook(() =>
      useFileUpload({
        errorMessage: CUSTOM_ERROR_MESSAGE,
        onError,
      }),
    );

    await act(async () => {
      await result.current.handleFileSelect(createChangeEvent(file));
    });

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(error, CUSTOM_ERROR_MESSAGE);
    });
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.isUploading).toBe(false);
  });
});
