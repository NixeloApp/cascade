import { describe, expect, it, vi } from "vitest";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { validateAttachment } from "./lib/fileValidators";

describe("validateAttachment", () => {
  it("should accept allowed file types", async () => {
    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue({
          contentType: "image/png",
        }),
        delete: vi.fn(),
      },
    } as unknown as MutationCtx;

    const storageId = "s123" as Id<"_storage">;
    const result = await validateAttachment(mockCtx, storageId);

    expect(result.valid).toBe(true);
    expect(mockCtx.storage.getMetadata).toHaveBeenCalledWith(storageId);
    expect(mockCtx.storage.delete).not.toHaveBeenCalled();
  });

  it("should reject and delete invalid file types (HTML)", async () => {
    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue({
          contentType: "text/html",
        }),
        delete: vi.fn().mockResolvedValue(null),
      },
    } as unknown as MutationCtx;

    const storageId = "s123" as Id<"_storage">;

    const result = await validateAttachment(mockCtx, storageId);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toMatch(/Invalid file type/);
    }

    expect(mockCtx.storage.getMetadata).toHaveBeenCalledWith(storageId);
    expect(mockCtx.storage.delete).toHaveBeenCalledWith(storageId);
  });

  it("should reject and delete invalid file types (EXE)", async () => {
    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue({
          contentType: "application/x-msdownload",
        }),
        delete: vi.fn().mockResolvedValue(null),
      },
    } as unknown as MutationCtx;

    const storageId = "s123" as Id<"_storage">;

    const result = await validateAttachment(mockCtx, storageId);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toMatch(/Invalid file type/);
    }

    expect(mockCtx.storage.delete).toHaveBeenCalledWith(storageId);
  });

  it("should throw error if file metadata is missing", async () => {
    const mockCtx = {
      storage: {
        getMetadata: vi.fn().mockResolvedValue(null),
        delete: vi.fn(),
      },
    } as unknown as MutationCtx;

    const storageId = "s123" as Id<"_storage">;

    const result = await validateAttachment(mockCtx, storageId);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe("File not found in storage");
    }

    expect(mockCtx.storage.getMetadata).toHaveBeenCalledWith(storageId);
    expect(mockCtx.storage.delete).not.toHaveBeenCalled();
  });
});
