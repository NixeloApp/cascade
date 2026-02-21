import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createDocumentInOrganization, createTestContext } from "./testUtils";

// Mock the prosemirror-sync library to intercept the callback
vi.mock("@convex-dev/prosemirror-sync", async () => {
  // We need to import these dynamically inside the mock
  const { internalMutation } = await import("./_generated/server");
  const { v } = await import("convex/values");

  return {
    ProsemirrorSync: class {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      syncApi(options: any) {
        const onSnapshot = options.onSnapshot;

        // Return a mock implementation of submitSnapshot that calls the onSnapshot callback
        // mimicking what the real component would do (but bypassing the component layer)
        const submitSnapshot = internalMutation({
          args: {
            id: v.id("documents"),
            version: v.number(),
            content: v.string(),
          },
          handler: async (ctx, args) => {
            // Invoke the callback containing the logic we want to test
            if (onSnapshot) {
              await onSnapshot(ctx, args.id, args.content, args.version);
            }
          },
        });

        // Return empty mocks for other functions as we don't test them here
        return {
          submitSnapshot,
          getSnapshot: {},
          latestVersion: {},
          getSteps: {},
          submitSteps: {},
        };
      }
    },
  };
});

describe("ProseMirror Versioning", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should throttle version creation", async () => {
    vi.useFakeTimers();
    // Set initial time
    const initialTime = new Date("2024-01-01T12:00:00Z").getTime();
    vi.setSystemTime(initialTime);

    // Note: We don't need to register the component because we mocked the module
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);

    const docId = await createDocumentInOrganization(t, userId, organizationId, {
      title: "Test Doc",
    });

    const snapshot = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "v1" }] }],
    });

    // submitSnapshot v1
    // This calls our mocked submitSnapshot, which calls onSnapshot from convex/prosemirror.ts
    await asUser.mutation(api.prosemirror.submitSnapshot, {
      id: docId,
      version: 1,
      content: snapshot,
    });

    // Check versions
    let versions = await asUser.query(api.documentVersions.listVersions, {
      documentId: docId,
    });
    expect(versions).toHaveLength(1);
    expect(versions[0].version).toBe(1);

    // Advance time by 30 seconds (less than 1 minute throttle)
    vi.advanceTimersByTime(30000);

    const snapshot2 = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "v2" }] }],
    });

    // submitSnapshot v2
    await asUser.mutation(api.prosemirror.submitSnapshot, {
      id: docId,
      version: 2,
      content: snapshot2,
    });

    // Check versions - should still be 1 because throttle is 60s
    versions = await asUser.query(api.documentVersions.listVersions, {
      documentId: docId,
    });
    expect(versions).toHaveLength(1);
    expect(versions[0].version).toBe(1);

    // Advance time by another 31 seconds (total > 60s)
    vi.advanceTimersByTime(31000);

    const snapshot3 = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "v3" }] }],
    });

    // submitSnapshot v3
    await asUser.mutation(api.prosemirror.submitSnapshot, {
      id: docId,
      version: 3,
      content: snapshot3,
    });

    // Check versions - should be 2 now
    versions = await asUser.query(api.documentVersions.listVersions, {
      documentId: docId,
    });
    expect(versions).toHaveLength(2);
    // Newest first
    expect(versions[0].version).toBe(3);
    expect(versions[1].version).toBe(1);
  });
});
