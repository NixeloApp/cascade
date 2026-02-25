import { describe, expect, it, vi } from "vitest";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { validateAttachment } from "./fileValidators";

describe("validateAttachment", () => {
  const mockStorageId = "kg2abc123def456ghi789jkl012mno34" as Id<"_storage">;

  it("should return metadata for valid file type", async () => {
    const mockMetadata = {
      contentType: "image/png",
      size: 1024,
      sha256: "somehash",
    };

    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue(mockMetadata),
        delete: vi.fn(),
      },
    } as unknown as MutationCtx;

    const result = await validateAttachment(mockCtx, mockStorageId);

    expect(result).toEqual({ valid: true, metadata: mockMetadata });
    expect(mockCtx.storage.getMetadata).toHaveBeenCalledWith(mockStorageId);
    expect(mockCtx.storage.delete).not.toHaveBeenCalled();
  });

  it("should return error if file not found in storage", async () => {
    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue(null),
        delete: vi.fn(),
      },
    } as unknown as MutationCtx;

    const result = await validateAttachment(mockCtx, mockStorageId);

    expect(result).toEqual({ valid: false, error: "File not found in storage" });
    expect(mockCtx.storage.getMetadata).toHaveBeenCalledWith(mockStorageId);
    expect(mockCtx.storage.delete).not.toHaveBeenCalled();
  });

  it("should delete file and return error for invalid mime type", async () => {
    const mockMetadata = {
      contentType: "application/x-msdownload", // .exe
      size: 1024,
    };

    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue(mockMetadata),
        delete: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as MutationCtx;

    const result = await validateAttachment(mockCtx, mockStorageId);

    expect(result).toEqual({
      valid: false,
      error: expect.stringMatching(/Invalid file type/),
    });
    expect(mockCtx.storage.getMetadata).toHaveBeenCalledWith(mockStorageId);
    expect(mockCtx.storage.delete).toHaveBeenCalledWith(mockStorageId);
  });

  it("should delete file and return error for missing mime type", async () => {
    const mockMetadata = {
      contentType: undefined,
      size: 1024,
    };

    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue(mockMetadata),
        delete: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as MutationCtx;

    const result = await validateAttachment(mockCtx, mockStorageId);

    expect(result).toEqual({
      valid: false,
      error: expect.stringMatching(/Invalid file type/),
    });
    expect(mockCtx.storage.getMetadata).toHaveBeenCalledWith(mockStorageId);
    expect(mockCtx.storage.delete).toHaveBeenCalledWith(mockStorageId);
  });

  it("should delete file and return error for empty string mime type", async () => {
    const mockMetadata = {
      contentType: "",
      size: 1024,
    };

    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue(mockMetadata),
        delete: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as MutationCtx;

    const result = await validateAttachment(mockCtx, mockStorageId);

    expect(result).toEqual({
      valid: false,
      error: expect.stringMatching(/Invalid file type/),
    });
    expect(mockCtx.storage.getMetadata).toHaveBeenCalledWith(mockStorageId);
    expect(mockCtx.storage.delete).toHaveBeenCalledWith(mockStorageId);
  });
});
