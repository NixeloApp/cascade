import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("Documents listChildren", () => {
  it("should correctly identify documents with children", async () => {
    const t = convexTest(schema, modules);
    const { organizationId, asUser } = await createTestContext(t);

    // 1. Create Grandparent (GP)
    const gpId = await asUser.mutation(api.documents.create, {
      title: "Grandparent",
      isPublic: true,
      organizationId,
    });

    // 2. Create Parent (P) under GP
    const pId = await asUser.mutation(api.documents.create, {
      title: "Parent",
      isPublic: true,
      organizationId,
      parentId: gpId,
    });

    // 3. Create Child (C) under P
    const cId = await asUser.mutation(api.documents.create, {
      title: "Child",
      isPublic: true,
      organizationId,
      parentId: pId,
    });

    // 4. List children of GP (expect P)
    const childrenOfGP = await asUser.query(api.documents.listChildren, {
      organizationId,
      parentId: gpId,
    });

    expect(childrenOfGP).toHaveLength(1);
    expect(childrenOfGP[0]._id).toBe(pId);
    expect(childrenOfGP[0].hasChildren).toBe(true); // P has children (C)

    // 5. List children of P (expect C)
    const childrenOfP = await asUser.query(api.documents.listChildren, {
      organizationId,
      parentId: pId,
    });

    expect(childrenOfP).toHaveLength(1);
    expect(childrenOfP[0]._id).toBe(cId);
    expect(childrenOfP[0].hasChildren).toBe(false); // C has no children
  });

  it("should correctly identify root documents with children", async () => {
    const t = convexTest(schema, modules);
    const { organizationId, asUser } = await createTestContext(t);

    // 1. Create Root 1 (with child)
    const r1Id = await asUser.mutation(api.documents.create, {
      title: "Root 1",
      isPublic: true,
      organizationId,
    });

    // 2. Create Root 2 (without child)
    const r2Id = await asUser.mutation(api.documents.create, {
      title: "Root 2",
      isPublic: true,
      organizationId,
    });

    // 3. Create child under Root 1
    await asUser.mutation(api.documents.create, {
      title: "Child of Root 1",
      isPublic: true,
      organizationId,
      parentId: r1Id,
    });

    // 4. List root documents
    const rootDocs = await asUser.query(api.documents.listChildren, {
      organizationId,
      parentId: undefined,
    });

    expect(rootDocs).toHaveLength(2);

    const r1 = rootDocs.find((d) => d._id === r1Id);
    const r2 = rootDocs.find((d) => d._id === r2Id);

    expect(r1).toBeDefined();
    expect(r1?.hasChildren).toBe(true);

    expect(r2).toBeDefined();
    expect(r2?.hasChildren).toBe(false);
  });
});
