import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestUser,
} from "./testUtils";

const clientsApi = anyApi.clients;
const invoicesApi = anyApi.invoices;
const invoicesActionsApi = anyApi.invoicesActions;

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

  it("lists client invoices beyond the bounded organization limit", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId, userId } = await createTestContext(t);

    const { clientId: targetClientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Target Client",
      email: "target@example.com",
    });
    const { clientId: otherClientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Overflow Client",
      email: "overflow@example.com",
    });

    const baseTime = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("invoices", {
        organizationId,
        clientId: targetClientId,
        number: "INV-TARGET-001",
        status: "sent",
        issueDate: baseTime - 10_000,
        dueDate: baseTime + 10_000,
        lineItems: [{ description: "Target work", quantity: 1, rate: 100, amount: 100 }],
        subtotal: 100,
        tax: undefined,
        total: 100,
        notes: undefined,
        pdfUrl: undefined,
        createdBy: userId,
        sentAt: baseTime - 5_000,
        paidAt: undefined,
        updatedAt: baseTime - 10_000,
      });

      for (let index = 0; index <= 100; index += 1) {
        await ctx.db.insert("invoices", {
          organizationId,
          clientId: otherClientId,
          number: `INV-OTHER-${index.toString().padStart(3, "0")}`,
          status: index % 2 === 0 ? "sent" : "draft",
          issueDate: baseTime + index,
          dueDate: baseTime + 20_000 + index,
          lineItems: [{ description: `Overflow ${index}`, quantity: 1, rate: 50, amount: 50 }],
          subtotal: 50,
          tax: undefined,
          total: 50,
          notes: undefined,
          pdfUrl: undefined,
          createdBy: userId,
          sentAt: index % 2 === 0 ? baseTime + index : undefined,
          paidAt: undefined,
          updatedAt: baseTime + index,
        });
      }
    });

    const targetInvoices = await asUser.query(invoicesApi.list, {
      organizationId,
      clientId: targetClientId,
    });
    expect(targetInvoices).toHaveLength(1);
    expect(targetInvoices[0]?.number).toBe("INV-TARGET-001");

    const targetSentInvoices = await asUser.query(invoicesApi.list, {
      organizationId,
      clientId: targetClientId,
      status: "sent",
    });
    expect(targetSentInvoices).toHaveLength(1);
    expect(targetSentInvoices[0]?.number).toBe("INV-TARGET-001");
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

  it("generates invoices from unbilled time entries and supports send/paid lifecycle", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId, userId } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Agency Project",
      key: "AGC",
    });

    const now = Date.now();
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);
    const { clientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Lifecycle Client",
      email: "lifecycle@example.com",
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("timeEntries", {
        userId,
        projectId,
        issueId: undefined,
        startTime: now - 7200000,
        endTime: now - 3600000,
        duration: 3600,
        date: startOfDay,
        description: "API implementation",
        activity: "Development",
        tags: [],
        hourlyRate: 150,
        totalCost: 150,
        currency: "USD",
        billable: true,
        billed: false,
        invoiceId: undefined,
        isEquityHour: false,
        equityValue: undefined,
        isLocked: false,
        isApproved: false,
        approvedBy: undefined,
        approvedAt: undefined,
        updatedAt: now,
      });
    });

    const generated = await asUser.mutation(invoicesApi.generateFromTimeEntries, {
      organizationId,
      clientId,
      issueDate: now,
      dueDate: now + 7 * 86400000,
      startDate: startOfDay,
      endDate: startOfDay + 86400000,
      projectId,
    });

    expect(generated.linkedEntries).toBe(1);

    const invoice = await asUser.query(invoicesApi.get, {
      organizationId,
      invoiceId: generated.invoiceId,
    });
    expect(invoice.status).toBe("draft");
    expect(invoice.subtotal).toBe(150);
    expect(invoice.lineItems[0]?.timeEntryIds?.length).toBe(1);

    await expect(
      asUser.mutation(invoicesApi.markPaid, {
        organizationId,
        invoiceId: generated.invoiceId,
      }),
    ).rejects.toThrow(/sent/i);

    await asUser.mutation(invoicesApi.send, {
      organizationId,
      invoiceId: generated.invoiceId,
    });
    await t.finishInProgressScheduledFunctions();
    await asUser.mutation(invoicesApi.markPaid, {
      organizationId,
      invoiceId: generated.invoiceId,
    });

    const paidInvoice = await asUser.query(invoicesApi.get, {
      organizationId,
      invoiceId: generated.invoiceId,
    });
    expect(paidInvoice.status).toBe("paid");
    expect(typeof paidInvoice.paidAt).toBe("number");

    const linkedEntry = await t.run(async (ctx) => {
      return await ctx.db
        .query("timeEntries")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .first();
    });
    expect(linkedEntry?.billed).toBe(true);
    expect(linkedEntry?.invoiceId).toBe(generated.invoiceId);
  });

  it("generates invoice PDF URL for admins and rejects members", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId, userId: ownerId } = await createTestContext(t);

    const { invoiceId } = await asUser.mutation(invoicesApi.create, {
      organizationId,
      issueDate: Date.now(),
      dueDate: Date.now() + 7 * 86400000,
      lineItems: [{ description: "PDF line", quantity: 1, rate: 99 }],
    });

    const pdfResult = await asUser.action(invoicesActionsApi.generatePdf, {
      organizationId,
      invoiceId,
    });
    expect(pdfResult.success).toBe(true);
    expect(pdfResult.pdfUrl).toContain("https://");

    const withPdf = await asUser.query(invoicesApi.get, { organizationId, invoiceId });
    expect(withPdf.pdfUrl).toBe(pdfResult.pdfUrl);

    const memberId = await createTestUser(t, { name: "Viewer" });
    await addUserToOrganization(t, organizationId, memberId, ownerId, "member");
    const asMember = asAuthenticatedUser(t, memberId);

    await expect(
      asMember.action(invoicesActionsApi.generatePdf, {
        organizationId,
        invoiceId,
      }),
    ).rejects.toThrow(/admin/i);
  });
});
