import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createTestUser,
} from "./testUtils";

describe("Documents Breadcrumbs Security", () => {
  it("should leak titles of private parent documents in breadcrumbs (repro)", async () => {
    const t = convexTest(schema, modules);

    // 1. Create User A (Admin)
    const userIdA = await createTestUser(t, { name: "User A" });
    const { organizationId } = await createOrganizationAdmin(t, userIdA, { name: "Org A" });
    const asUserA = asAuthenticatedUser(t, userIdA);

    // 2. Create User B (Member)
    const userIdB = await createTestUser(t, { name: "User B" });
    await addUserToOrganization(t, organizationId, userIdB, userIdA, "member");
    const asUserB = asAuthenticatedUser(t, userIdB);

    // 3. User A creates "Private Parent" (Private)
    const { documentId: privateParentId } = await asUserA.mutation(api.documents.create, {
      title: "Private Parent",
      isPublic: false,
      organizationId,
    });

    // 4. User A creates "Public Child" inside "Private Parent" (Public)
    const { documentId: publicChildId } = await asUserA.mutation(api.documents.create, {
      title: "Public Child",
      isPublic: true,
      organizationId,
      parentId: privateParentId,
    });

    // 5. User B requests breadcrumbs for "Public Child"
    // User B should access "Public Child" because it is public in the org.
    // However, User B should NOT access "Private Parent".
    const breadcrumbs = await asUserB.query(api.documents.getBreadcrumbs, {
      id: publicChildId,
    });

    // 6. Verify that "Private Parent" is NOT leaked
    const leakedParent = breadcrumbs.find((b) => b.title === "Private Parent");
    expect(leakedParent).toBeUndefined();

    // 7. Verify that "Private Document" placeholder is present
    const redactedParent = breadcrumbs.find((b) => b.title === "Private Document");
    expect(redactedParent).toBeDefined();
    expect(redactedParent?._id).toEqual(privateParentId);
  });
});
