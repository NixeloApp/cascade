import { describe, expect, it, vi } from "vitest";
import { isSuppressed, suppress } from "./contacts";

vi.mock("../lib/boundedQueries", () => ({
  BOUNDED_LIST_LIMIT: 100,
}));

describe("outreach contacts", () => {
  describe("module exports", () => {
    it("exports query and mutation functions", async () => {
      const mod = await import("./contacts");
      expect(typeof mod.list).toBe("function");
      expect(typeof mod.get).toBe("function");
      expect(typeof mod.create).toBe("function");
      expect(typeof mod.importBatch).toBe("function");
      expect(typeof mod.update).toBe("function");
      expect(typeof mod.remove).toBe("function");
    });

    it("exports helper functions", async () => {
      const mod = await import("./contacts");
      expect(typeof mod.isSuppressed).toBe("function");
      expect(typeof mod.suppress).toBe("function");
    });
  });

  describe("isSuppressed", () => {
    it("returns true when email is in suppression list", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue({
                _id: "sup1",
                email: "blocked@test.com",
                reason: "hard_bounce",
              }),
            }),
          }),
        },
      };

      const result = await isSuppressed(mockCtx as any, "org1" as any, "blocked@test.com");
      expect(result).toBe(true);
    });

    it("returns false when email is not suppressed", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
            }),
          }),
        },
      };

      const result = await isSuppressed(mockCtx as any, "org1" as any, "clean@test.com");
      expect(result).toBe(false);
    });

    it("normalizes email to lowercase and trimmed", async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockWithIndex = vi.fn().mockReturnValue({ first: mockFirst });
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({ withIndex: mockWithIndex }),
        },
      };

      await isSuppressed(mockCtx as any, "org1" as any, "  Test@Example.COM  ");

      expect(mockWithIndex).toHaveBeenCalledWith("by_organization_email", expect.any(Function));
    });
  });

  describe("suppress", () => {
    it("inserts suppression record when not already suppressed", async () => {
      const mockInsert = vi.fn();
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null), // Not already suppressed
            }),
          }),
          insert: mockInsert,
        },
      };

      await suppress(mockCtx as any, "org1" as any, "bounce@test.com", "hard_bounce");

      expect(mockInsert).toHaveBeenCalledWith("outreachSuppressions", {
        organizationId: "org1",
        email: "bounce@test.com",
        reason: "hard_bounce",
        suppressedAt: expect.any(Number),
        sourceEnrollmentId: undefined,
      });
    });

    it("does not duplicate suppression for already-suppressed email", async () => {
      const mockInsert = vi.fn();
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue({
                _id: "existing",
                email: "bounce@test.com",
              }),
            }),
          }),
          insert: mockInsert,
        },
      };

      await suppress(mockCtx as any, "org1" as any, "bounce@test.com", "unsubscribe");

      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("stores sourceEnrollmentId when provided", async () => {
      const mockInsert = vi.fn();
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
            }),
          }),
          insert: mockInsert,
        },
      };

      await suppress(
        mockCtx as any,
        "org1" as any,
        "test@test.com",
        "unsubscribe",
        "enrollment123" as any,
      );

      expect(mockInsert).toHaveBeenCalledWith(
        "outreachSuppressions",
        expect.objectContaining({
          sourceEnrollmentId: "enrollment123",
        }),
      );
    });
  });
});
