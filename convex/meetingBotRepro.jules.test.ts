import { convexTest } from "convex-test";
import { describe, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext, expectThrowsAsync } from "./testUtils";

describe("MeetingBot Access Control Reproduction", () => {
  it("FIXED: listRecordings throws Forbidden when accessing other projects", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Victim (User A, Org A, Project A)
    const {
      asUser: asVictim,
      userId: victimId,
      organizationId: victimOrgId,
    } = await createTestContext(t, { name: "Victim" });
    const victimProjectId = await createProjectInOrganization(t, victimId, victimOrgId, {
      name: "Secret Project",
      key: "SECRET",
    });

    // Victim creates a private recording
    await asVictim.mutation(api.meetingBot.scheduleRecording, {
      meetingUrl: "https://zoom.us/j/123",
      title: "Sensitive Merger Discussion",
      meetingPlatform: "zoom",
      scheduledStartTime: Date.now() + 100000,
      projectId: victimProjectId,
      isPublic: false,
    });

    // 2. Setup Attacker (User B, Org B)
    const { asUser: asAttacker } = await createTestContext(t, { name: "Attacker" });

    // 3. Attacker lists recordings for Victim's project
    // This should now throw Forbidden
    await expectThrowsAsync(async () => {
      await asAttacker.query(api.meetingBot.listRecordings, {
        projectId: victimProjectId,
      });
    });
  });

  it("FIXED: getRecording throws Forbidden for PUBLIC recording in PRIVATE project accessed by outsider", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Victim
    const {
      asUser: asVictim,
      userId: victimId,
      organizationId: victimOrgId,
    } = await createTestContext(t, { name: "Victim" });
    const victimProjectId = await createProjectInOrganization(t, victimId, victimOrgId, {
      name: "Secret Project 2",
      key: "SECRET2",
    });

    // Victim creates PUBLIC recording in PRIVATE project
    const publicRecordingId = await asVictim.mutation(api.meetingBot.scheduleRecording, {
      meetingUrl: "https://zoom.us/j/789",
      title: "Public Meeting in Private Project",
      meetingPlatform: "zoom",
      scheduledStartTime: Date.now() + 100000,
      projectId: victimProjectId,
      isPublic: true,
    });

    // 2. Setup Attacker (Not in project/org)
    const { asUser: asAttacker } = await createTestContext(t, { name: "Attacker" });

    // 3. Attacker fetches public recording by ID
    // Should fail because Attacker is not in the project
    await expectThrowsAsync(async () => {
      await asAttacker.query(api.meetingBot.getRecording, {
        recordingId: publicRecordingId,
      });
    });
  });
});
