import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  addUserToOrganization,
  asAuthenticatedUser,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("Out of Office", () => {
  it("stores status and returns active state for the current user", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);
    const now = Date.now();

    await asUser.mutation(api.outOfOffice.upsert, {
      startsAt: now - 60_000,
      endsAt: now + 86_400_000,
      reason: "vacation",
      note: "Away this afternoon",
    });

    const status = await asUser.query(api.outOfOffice.getCurrent, {});

    expect(status).not.toBeNull();
    expect(status?.reason).toBe("vacation");
    expect(status?.note).toBe("Away this afternoon");
    expect(status?.isActive).toBe(true);
  });

  it("clears the stored status", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);
    const now = Date.now();

    await asUser.mutation(api.outOfOffice.upsert, {
      startsAt: now,
      endsAt: now + 86_400_000,
      reason: "travel",
    });

    await asUser.mutation(api.outOfOffice.clear, {});

    const status = await asUser.query(api.outOfOffice.getCurrent, {});
    expect(status).toBeNull();
  });

  it("surfaces active OOO on project members for assignee pickers", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);
    const projectId = await createTestProject(t, userId);
    const now = Date.now();

    await asUser.mutation(api.outOfOffice.upsert, {
      startsAt: now - 60_000,
      endsAt: now + 86_400_000,
      reason: "public_holiday",
    });

    const project = await asUser.query(api.projects.getProject, { id: projectId });
    const selfMember = project?.members.find((member) => member._id === userId);

    expect(selfMember?.outOfOffice?.reason).toBe("public_holiday");
  });

  it("stores and returns a delegate summary", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { name: "OOO User" });
    const delegateUserId = await createTestUser(t, { name: "Delegate User" });
    const projectId = await createTestProject(t, userId);
    const project = await t.run(async (ctx) => ctx.db.get(projectId));

    if (!project) {
      throw new Error("Project not found");
    }

    await addUserToOrganization(t, project.organizationId, delegateUserId, userId);
    await addProjectMember(t, projectId, delegateUserId, "editor", userId);

    const asUser = asAuthenticatedUser(t, userId);
    const now = Date.now();

    await asUser.mutation(api.outOfOffice.upsert, {
      startsAt: now - 60_000,
      endsAt: now + 86_400_000,
      reason: "vacation",
      delegateUserId,
    });

    const status = await asUser.query(api.outOfOffice.getCurrent, {});

    expect(status?.delegate?._id).toBe(delegateUserId);
    expect(status?.delegate?.name).toBe("Delegate User");
  });

  it("rejects delegates outside a shared organization", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { name: "OOO User" });
    const outsiderId = await createTestUser(t, { name: "Outsider" });
    await createTestProject(t, userId);
    const asUser = asAuthenticatedUser(t, userId);
    const now = Date.now();

    await expect(
      asUser.mutation(api.outOfOffice.upsert, {
        startsAt: now,
        endsAt: now + 86_400_000,
        reason: "travel",
        delegateUserId: outsiderId,
      }),
    ).rejects.toThrow("Delegate must share an organization with you");
  });
});
