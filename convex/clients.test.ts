import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
  asAuthenticatedUser,
  createTestContext,
  createTestUser,
} from "./testUtils";

const clientsApi = anyApi.clients;
const invoicesApi = anyApi.invoices;

describe("clients", () => {
  it("allows org admin to create, update, and remove clients", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId } = await createTestContext(t);

    const { clientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Acme Corp",
      email: "billing@acme.dev",
      company: "Acme",
      hourlyRate: 150,
    });

    const fetched = await asUser.query(clientsApi.get, { organizationId, clientId });
    expect(fetched.name).toBe("Acme Corp");
    expect(fetched.email).toBe("billing@acme.dev");

    await asUser.mutation(clientsApi.update, {
      organizationId,
      clientId,
      name: "Acme Holdings",
      hourlyRate: 175,
    });

    const updated = await asUser.query(clientsApi.get, { organizationId, clientId });
    expect(updated.name).toBe("Acme Holdings");
    expect(updated.hourlyRate).toBe(175);

    const listedClients = await asUser.query(clientsApi.list, { organizationId });
    expect(listedClients).toHaveLength(1);

    await asUser.mutation(clientsApi.remove, { organizationId, clientId });
    const finalList = await asUser.query(clientsApi.list, { organizationId });
    expect(finalList).toHaveLength(0);
  });

  it("prevents deleting clients that have linked invoices", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId } = await createTestContext(t);

    const { clientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Beta LLC",
      email: "finance@beta.dev",
    });

    await asUser.mutation(invoicesApi.create, {
      organizationId,
      clientId,
      issueDate: Date.now(),
      dueDate: Date.now() + 86400000,
      lineItems: [{ description: "Implementation", quantity: 4, rate: 120 }],
    });

    await expect(
      asUser.mutation(clientsApi.remove, {
        organizationId,
        clientId,
      }),
    ).rejects.toThrow(/existing invoices/i);
  });

  it("allows members to read but not mutate clients", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId, userId: ownerId } = await createTestContext(t);

    const { clientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Gamma",
      email: "hello@gamma.dev",
    });

    const memberId = await createTestUser(t, { name: "Member" });
    await addUserToOrganization(t, organizationId, memberId, ownerId, "member");
    const asMember = asAuthenticatedUser(t, memberId);

    const list = await asMember.query(clientsApi.list, { organizationId });
    expect(list).toHaveLength(1);

    await expect(
      asMember.mutation(clientsApi.update, {
        organizationId,
        clientId,
        name: "New Name",
      }),
    ).rejects.toThrow(/admin/i);
  });
});
