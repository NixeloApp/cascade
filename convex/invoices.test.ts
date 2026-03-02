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

describe("invoices", () => {
  it("creates invoices with computed totals and generated number", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId } = await createTestContext(t);

    const { clientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Acme",
      email: "billing@acme.dev",
      hourlyRate: 100,
    });

    const { invoiceId } = await asUser.mutation(invoicesApi.create, {
      organizationId,
      clientId,
      issueDate: Date.now(),
      dueDate: Date.now() + 7 * 86400000,
      tax: 20,
      lineItems: [
        { description: "Design", quantity: 2, rate: 100 },
        { description: "Development", quantity: 3, rate: 120 },
      ],
      notes: "Net 7",
    });

    const invoice = await asUser.query(invoicesApi.get, { organizationId, invoiceId });
    expect(invoice.status).toBe("draft");
    expect(invoice.subtotal).toBe(560);
    expect(invoice.total).toBe(580);
    expect(invoice.number).toMatch(/^INV-\d{4}-001$/);
  });

  it("supports list filters and status updates", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId } = await createTestContext(t);

    const { invoiceId } = await asUser.mutation(invoicesApi.create, {
      organizationId,
      issueDate: Date.now(),
      dueDate: Date.now() + 7 * 86400000,
      lineItems: [{ description: "Audit", quantity: 1, rate: 250 }],
    });

    await asUser.mutation(invoicesApi.update, {
      organizationId,
      invoiceId,
      status: "sent",
      lineItems: [{ description: "Audit", quantity: 2, rate: 250 }],
      tax: 50,
    });

    const sent = await asUser.query(invoicesApi.list, {
      organizationId,
      status: "sent",
    });
    expect(sent).toHaveLength(1);
    expect(sent[0].subtotal).toBe(500);
    expect(sent[0].total).toBe(550);
    expect(typeof sent[0].sentAt).toBe("number");
  });

  it("rejects invoices tied to clients from another organization", async () => {
    const t = convexTest(schema, modules);
    const ctxA = await createTestContext(t);
    const ctxB = await createTestContext(t, { email: "other@example.com" });

    const { clientId } = await ctxB.asUser.mutation(clientsApi.create, {
      organizationId: ctxB.organizationId,
      name: "Foreign",
      email: "foreign@example.com",
    });

    await expect(
      ctxA.asUser.mutation(invoicesApi.create, {
        organizationId: ctxA.organizationId,
        clientId,
        issueDate: Date.now(),
        dueDate: Date.now() + 7 * 86400000,
        lineItems: [{ description: "Work", quantity: 1, rate: 100 }],
      }),
    ).rejects.toThrow(/client/i);
  });

  it("allows members to read but not mutate invoices", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId, userId: ownerId } = await createTestContext(t);

    const { invoiceId } = await asUser.mutation(invoicesApi.create, {
      organizationId,
      issueDate: Date.now(),
      dueDate: Date.now() + 7 * 86400000,
      lineItems: [{ description: "Ops", quantity: 1, rate: 120 }],
    });

    const memberId = await createTestUser(t, { name: "Member" });
    await addUserToOrganization(t, organizationId, memberId, ownerId, "member");
    const asMember = asAuthenticatedUser(t, memberId);

    const visible = await asMember.query(invoicesApi.list, { organizationId });
    expect(visible).toHaveLength(1);

    await expect(
      asMember.mutation(invoicesApi.update, {
        organizationId,
        invoiceId,
        notes: "Should fail",
      }),
    ).rejects.toThrow(/admin/i);
  });
});
