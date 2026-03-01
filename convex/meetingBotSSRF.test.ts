import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("MeetingBot SSRF Security", () => {
  it("should block scheduling recordings with private IP addresses", async () => {
    const t = convexTest(schema, modules);
    const { asUser, userId, organizationId } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Test Project",
      key: "PROJ",
    });

    const privateIpUrl = "http://127.0.0.1/admin";

    // Attempt to schedule recording with private IP - should fail validation
    await expect(
      asUser.mutation(api.meetingBot.scheduleRecording, {
        meetingUrl: privateIpUrl,
        title: "SSRF Attempt",
        meetingPlatform: "other",
        scheduledStartTime: Date.now() + 3600000,
        projectId,
      }),
    ).rejects.toThrow(/Private IP addresses are not allowed/);
  });

  it("should block starting immediate recordings with private IP addresses", async () => {
    const t = convexTest(schema, modules);
    const { asUser, userId, organizationId } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Test Project",
      key: "PROJ",
    });

    const privateIpUrl = "http://192.168.1.1/internal";

    // Attempt to start recording now with private IP - should fail validation
    await expect(
      asUser.mutation(api.meetingBot.startRecordingNow, {
        meetingUrl: privateIpUrl,
        title: "SSRF Attempt Immediate",
        meetingPlatform: "other",
        projectId,
      }),
    ).rejects.toThrow(/Private IP addresses are not allowed/);
  });

  it("should allow public URLs", async () => {
    const t = convexTest(schema, modules);
    const { asUser, userId, organizationId } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Test Project",
      key: "PROJ",
    });

    // Public URL (example.com resolves to public IP)
    const publicUrl = "https://example.com/meeting";

    // Should succeed
    await expect(
      asUser.mutation(api.meetingBot.scheduleRecording, {
        meetingUrl: publicUrl,
        title: "Valid Meeting",
        meetingPlatform: "other",
        scheduledStartTime: Date.now() + 3600000,
        projectId,
      }),
    ).resolves.not.toThrow();
  });
});
