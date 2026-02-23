import { describe, expect, it, vi } from "vitest";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { validateAttachment } from "./fileValidators";

describe("validateAttachment", () => {
  const mockStorageId = "storage-id" as Id<"_storage">;

  it("should return metadata for valid file type", async () => {
    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue({
          contentType: "image/png",
          size: 100,
          sha256: "hash",
        }),
        delete: vi.fn(),
      },
    } as unknown as MutationCtx;

    const metadata = await validateAttachment(mockCtx, mockStorageId);

    expect(metadata).toEqual({
      contentType: "image/png",
      size: 100,
      sha256: "hash",
    });
    expect(mockCtx.storage.delete).not.toHaveBeenCalled();
  });

  it("should throw error if file not found", async () => {
    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue(null),
        delete: vi.fn(),
      },
    } as unknown as MutationCtx;

    await expect(validateAttachment(mockCtx, mockStorageId)).rejects.toThrow(
      "File not found in storage",
    );
    expect(mockCtx.storage.delete).not.toHaveBeenCalled();
  });

  it("should throw error and delete file for invalid MIME type", async () => {
    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue({
          contentType: "application/x-msdownload", // potentially dangerous
          size: 100,
        }),
        delete: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as MutationCtx;

    await expect(validateAttachment(mockCtx, mockStorageId)).rejects.toThrow("Invalid file type");
    expect(mockCtx.storage.delete).toHaveBeenCalledWith(mockStorageId);
  });

  it("should throw error and delete file for missing content type", async () => {
    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue({
          contentType: undefined,
          size: 100,
        }),
        delete: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as MutationCtx;

    await expect(validateAttachment(mockCtx, mockStorageId)).rejects.toThrow("Invalid file type");
    expect(mockCtx.storage.delete).toHaveBeenCalledWith(mockStorageId);
  });
});
