import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("Attachments", () => {
  describe("generateUploadUrl", () => {
    it("should generate upload URL for authenticated user", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const url = await asUser.mutation(api.attachments.generateUploadUrl, {});

      expect(url).toBeDefined();
      expect(typeof url).toBe("string");
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.mutation(api.attachments.generateUploadUrl, {})).rejects.toThrow(
        /authenticated/i,
      );
    });
  });

  // Note: getAttachment requires a valid storage ID from an actual file upload.
  // Storage operations can't be mocked in convex-test, so auth tests for
  // getAttachment are covered in E2E tests.

  // Note: attachToIssue and removeAttachment tests require valid storage IDs
  // which are difficult to mock in convex-test. These operations are tested via E2E tests.
  // The core logic (project access checks, activity logging) is tested in issues.test.ts
});
