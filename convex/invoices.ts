/**
 * Agency Invoices
 *
 * Base CRUD for organization-scoped invoices.
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, type QueryCtx } from "./_generated/server";
import { organizationAdminMutation, organizationQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { conflict, forbidden, notFound, validation } from "./lib/errors";
import { isOrganizationAdmin } from "./lib/organizationAccess";

const invoiceStatusValidator = v.union(
  v.literal("draft"),
  v.literal("sent"),
  v.literal("paid"),
  v.literal("overdue"),
);

const invoiceLineItemInputValidator = v.object({
  description: v.string(),
  quantity: v.number(),
  rate: v.number(),
  timeEntryIds: v.optional(v.array(v.id("timeEntries"))),
});

type InvoiceLineItemInput = {
  description: string;
  quantity: number;
  rate: number;
  timeEntryIds?: Id<"timeEntries">[];
};

type NormalizedLineItem = {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  timeEntryIds?: Id<"timeEntries">[];
};

function normalizeLineItems(lineItems: InvoiceLineItemInput[]): NormalizedLineItem[] {
  return lineItems.map((item) => {
    if (item.quantity <= 0) {
      throw validation("lineItems", "Line item quantity must be greater than zero");
    }
    if (item.rate < 0) {
      throw validation("lineItems", "Line item rate must be zero or greater");
    }
    const result: NormalizedLineItem = {
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.quantity * item.rate,
    };
    if (item.timeEntryIds !== undefined) {
      result.timeEntryIds = item.timeEntryIds;
    }
    return result;
  });
}

function calculateTotals(lineItems: NormalizedLineItem[], tax?: number) {
  if (tax !== undefined && tax < 0) {
    throw validation("tax", "Tax must be zero or greater");
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = tax ?? 0;
  return {
    subtotal,
    total: subtotal + taxAmount,
  };
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

type InvoiceSummary = Pick<
  Doc<"invoices">,
  | "_id"
  | "organizationId"
  | "number"
  | "issueDate"
  | "dueDate"
  | "lineItems"
  | "subtotal"
  | "tax"
  | "total"
  | "notes"
>;

function buildInvoiceEmailHtml(params: {
  clientName?: string;
  invoiceNumber: string;
  dueDate: number;
  total: number;
  pdfUrl?: string;
}) {
  const greeting = params.clientName ? `Hi ${params.clientName},` : "Hello,";
  const dueDate = new Date(params.dueDate).toISOString().slice(0, 10);
  const pdfLine = params.pdfUrl
    ? `<p><a href="${params.pdfUrl}">Download invoice PDF</a></p>`
    : "<p>The invoice PDF will be available shortly.</p>";

  return [
    `<p>${greeting}</p>`,
    `<p>Your invoice <strong>${params.invoiceNumber}</strong> is now available.</p>`,
    `<p>Total: <strong>${formatCurrency(params.total)}</strong></p>`,
    `<p>Due date: <strong>${dueDate}</strong></p>`,
    pdfLine,
    "<p>Thank you.</p>",
  ].join("");
}

async function assertClientInOrganization(
  ctx: Pick<QueryCtx, "db">,
  organizationId: Id<"organizations">,
  clientId?: Id<"clients">,
) {
  if (!clientId) {
    return;
  }

  const client = await ctx.db.get(clientId);
  if (!client || client.organizationId !== organizationId) {
    throw notFound("client", clientId);
  }
}

async function generateInvoiceNumber(
  ctx: Pick<QueryCtx, "db">,
  organizationId: Id<"organizations">,
) {
  const year = new Date().getUTCFullYear();
  const yearPrefix = `INV-${year}-`;

  // Find max sequence for current year by checking existing invoice numbers
  const MAX_INVOICE_SCAN = 1000;
  const invoices = await ctx.db
    .query("invoices")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
    .take(MAX_INVOICE_SCAN);

  // Extract sequence numbers from invoices matching current year pattern
  let maxSequence = 0;
  for (const invoice of invoices) {
    if (invoice.number.startsWith(yearPrefix)) {
      const sequencePart = invoice.number.slice(yearPrefix.length);
      const sequence = Number.parseInt(sequencePart, 10);
      if (!Number.isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  }

  const nextSequence = maxSequence + 1;
  return `${yearPrefix}${String(nextSequence).padStart(3, "0")}`;
}

async function getUnbilledBillableEntries(
  ctx: Pick<QueryCtx, "db">,
  organizationId: Id<"organizations">,
  startDate: number,
  endDate: number,
  userId?: Id<"users">,
  projectId?: Id<"projects">,
) {
  // Use more specific indexes to avoid filtering after limit
  // This prevents missing entries when other orgs have many entries in the date range
  let entries: Doc<"timeEntries">[];
  if (projectId) {
    // Best case: filter by project first (org-scoped)
    entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_project_date", (q) =>
        q.eq("projectId", projectId).gte("date", startDate).lte("date", endDate),
      )
      .take(BOUNDED_LIST_LIMIT);
  } else if (userId) {
    // Second best: filter by user first
    entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).gte("date", startDate).lte("date", endDate),
      )
      .take(BOUNDED_LIST_LIMIT);
  } else {
    // Fallback: general date query with larger limit
    entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_date", (q) => q.gte("date", startDate).lte("date", endDate))
      .take(BOUNDED_LIST_LIMIT * 5);
  }

  const candidateEntries = entries.filter(
    (entry) =>
      entry.billable &&
      !entry.billed &&
      entry.endTime !== undefined &&
      entry.projectId !== undefined &&
      (userId === undefined || entry.userId === userId) &&
      (projectId === undefined || entry.projectId === projectId),
  );

  const projectIds = [
    ...new Set(
      candidateEntries
        .map((entry) => entry.projectId)
        .filter((id): id is Id<"projects"> => id !== undefined),
    ),
  ];
  const projects = await Promise.all(projectIds.map((id) => ctx.db.get(id)));
  const projectOrgMap = new Map(
    projects
      .filter((project): project is Doc<"projects"> => project !== null)
      .map((project) => [project._id, project.organizationId]),
  );

  return candidateEntries.filter((entry) => {
    if (!entry.projectId) {
      return false;
    }
    return projectOrgMap.get(entry.projectId) === organizationId;
  });
}

export const create = organizationAdminMutation({
  args: {
    clientId: v.optional(v.id("clients")),
    issueDate: v.number(),
    dueDate: v.number(),
    lineItems: v.array(invoiceLineItemInputValidator),
    tax: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.object({ success: v.literal(true), invoiceId: v.id("invoices") }),
  handler: async (ctx, args) => {
    if (args.dueDate < args.issueDate) {
      throw validation("dueDate", "Due date must be greater than or equal to issue date");
    }
    if (args.lineItems.length === 0) {
      throw validation("lineItems", "At least one line item is required");
    }

    await assertClientInOrganization(ctx, ctx.organizationId, args.clientId);

    const normalizedLineItems = normalizeLineItems(args.lineItems);
    const totals = calculateTotals(normalizedLineItems, args.tax);
    const number = await generateInvoiceNumber(ctx, ctx.organizationId);

    const existing = await ctx.db
      .query("invoices")
      .withIndex("by_number", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("number", number),
      )
      .first();
    if (existing) {
      throw conflict("Invoice number collision, please retry");
    }

    const now = Date.now();
    const invoiceId = await ctx.db.insert("invoices", {
      organizationId: ctx.organizationId,
      clientId: args.clientId,
      number,
      status: "draft",
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      lineItems: normalizedLineItems,
      subtotal: totals.subtotal,
      tax: args.tax,
      total: totals.total,
      notes: args.notes,
      pdfUrl: undefined,
      createdBy: ctx.userId,
      sentAt: undefined,
      paidAt: undefined,
      updatedAt: now,
    });

    return { success: true, invoiceId } as const;
  },
});

export const list = organizationQuery({
  args: {
    status: v.optional(invoiceStatusValidator),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    if (args.clientId) {
      await assertClientInOrganization(ctx, ctx.organizationId, args.clientId);
    }

    const status = args.status;
    const invoices = status
      ? await ctx.db
          .query("invoices")
          .withIndex("by_status", (q) =>
            q.eq("organizationId", ctx.organizationId).eq("status", status),
          )
          .order("desc")
          .take(BOUNDED_LIST_LIMIT)
      : await ctx.db
          .query("invoices")
          .withIndex("by_organization", (q) => q.eq("organizationId", ctx.organizationId))
          .order("desc")
          .take(BOUNDED_LIST_LIMIT);

    if (!args.clientId) {
      return invoices;
    }

    return invoices.filter((invoice) => invoice.clientId === args.clientId);
  },
});

export const get = organizationQuery({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.organizationId !== ctx.organizationId) {
      throw notFound("invoice", args.invoiceId);
    }
    return invoice;
  },
});

export const update = organizationAdminMutation({
  args: {
    invoiceId: v.id("invoices"),
    clientId: v.optional(v.id("clients")),
    status: v.optional(invoiceStatusValidator),
    issueDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    lineItems: v.optional(v.array(invoiceLineItemInputValidator)),
    tax: v.optional(v.number()),
    notes: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.organizationId !== ctx.organizationId) {
      throw notFound("invoice", args.invoiceId);
    }

    const issueDate = args.issueDate ?? invoice.issueDate;
    const dueDate = args.dueDate ?? invoice.dueDate;
    if (dueDate < issueDate) {
      throw validation("dueDate", "Due date must be greater than or equal to issue date");
    }

    const effectiveClientId = args.clientId ?? invoice.clientId;
    await assertClientInOrganization(ctx, ctx.organizationId, effectiveClientId);

    const normalizedLineItems = args.lineItems
      ? normalizeLineItems(args.lineItems)
      : invoice.lineItems;
    const effectiveTax = args.tax ?? invoice.tax;
    const totals = calculateTotals(normalizedLineItems, effectiveTax);

    const status = args.status ?? invoice.status;
    const now = Date.now();

    await ctx.db.patch(args.invoiceId, {
      clientId: effectiveClientId,
      status,
      issueDate,
      dueDate,
      lineItems: normalizedLineItems,
      subtotal: totals.subtotal,
      tax: effectiveTax,
      total: totals.total,
      notes: args.notes ?? invoice.notes,
      pdfUrl: args.pdfUrl ?? invoice.pdfUrl,
      sentAt: status === "sent" && !invoice.sentAt ? now : invoice.sentAt,
      paidAt: status === "paid" && !invoice.paidAt ? now : invoice.paidAt,
      updatedAt: now,
    });

    return { success: true } as const;
  },
});

export const generateFromTimeEntries = organizationAdminMutation({
  args: {
    clientId: v.optional(v.id("clients")),
    issueDate: v.number(),
    dueDate: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    userId: v.optional(v.id("users")),
    projectId: v.optional(v.id("projects")),
    tax: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.literal(true),
    invoiceId: v.id("invoices"),
    linkedEntries: v.number(),
  }),
  handler: async (ctx, args) => {
    if (args.endDate < args.startDate) {
      throw validation("endDate", "End date must be greater than or equal to start date");
    }
    if (args.dueDate < args.issueDate) {
      throw validation("dueDate", "Due date must be greater than or equal to issue date");
    }
    await assertClientInOrganization(ctx, ctx.organizationId, args.clientId);

    const timeEntries = await getUnbilledBillableEntries(
      ctx,
      ctx.organizationId,
      args.startDate,
      args.endDate,
      args.userId,
      args.projectId,
    );

    if (timeEntries.length === 0) {
      throw validation(
        "startDate",
        "No unbilled billable time entries found in the requested range",
      );
    }

    const lineItems = normalizeLineItems(
      timeEntries.map((entry) => ({
        description:
          entry.description || `Time entry ${new Date(entry.date).toISOString().slice(0, 10)}`,
        quantity: entry.duration / 3600,
        rate: entry.hourlyRate ?? 0,
        timeEntryIds: [entry._id],
      })),
    );
    const totals = calculateTotals(lineItems, args.tax);
    const number = await generateInvoiceNumber(ctx, ctx.organizationId);

    // Check uniqueness before inserting (same check as create mutation)
    const existing = await ctx.db
      .query("invoices")
      .withIndex("by_number", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("number", number),
      )
      .first();
    if (existing) {
      throw conflict("Invoice number collision, please retry");
    }

    const now = Date.now();

    const invoiceId = await ctx.db.insert("invoices", {
      organizationId: ctx.organizationId,
      clientId: args.clientId,
      number,
      status: "draft",
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      lineItems,
      subtotal: totals.subtotal,
      tax: args.tax,
      total: totals.total,
      notes: args.notes,
      pdfUrl: undefined,
      createdBy: ctx.userId,
      sentAt: undefined,
      paidAt: undefined,
      updatedAt: now,
    });

    await Promise.all(
      timeEntries.map((entry) =>
        ctx.db.patch(entry._id, {
          billed: true,
          invoiceId,
          updatedAt: now,
        }),
      ),
    );

    return { success: true, invoiceId, linkedEntries: timeEntries.length } as const;
  },
});

export const send = organizationAdminMutation({
  args: {
    invoiceId: v.id("invoices"),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.organizationId !== ctx.organizationId) {
      throw notFound("invoice", args.invoiceId);
    }
    if (invoice.status === "paid") {
      throw conflict("Paid invoices cannot be moved back to sent");
    }

    if (!invoice.clientId) {
      throw validation("invoiceId", "Invoice must have a client before sending");
    }

    const client = await ctx.db.get(invoice.clientId);
    if (!client || client.organizationId !== ctx.organizationId || !client.email) {
      throw validation("invoiceId", "Invoice client email is required for sending");
    }

    const now = Date.now();
    await ctx.db.patch(args.invoiceId, {
      status: "sent",
      sentAt: invoice.sentAt ?? now,
      updatedAt: now,
    });
    if (!process.env.IS_TEST_ENV) {
      await ctx.scheduler.runAfter(0, internal.email.index.sendEmailAction, {
        to: client.email,
        subject: `Invoice ${invoice.number} from Nixelo`,
        html: buildInvoiceEmailHtml({
          clientName: client.name,
          invoiceNumber: invoice.number,
          dueDate: invoice.dueDate,
          total: invoice.total,
          pdfUrl: invoice.pdfUrl,
        }),
        text: [
          `Invoice ${invoice.number}`,
          `Total: ${formatCurrency(invoice.total)}`,
          `Due: ${new Date(invoice.dueDate).toISOString().slice(0, 10)}`,
          invoice.pdfUrl ? `PDF: ${invoice.pdfUrl}` : "PDF: pending generation",
        ].join("\n"),
      });
    }

    return { success: true } as const;
  },
});

// generatePdf action moved to invoicesActions.ts (requires "use node")

export const getInvoiceForPdfGeneration = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    invoiceId: v.id("invoices"),
    userId: v.id("users"),
  },
  returns: v.object({
    _id: v.id("invoices"),
    organizationId: v.id("organizations"),
    number: v.string(),
    issueDate: v.number(),
    dueDate: v.number(),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        rate: v.number(),
        amount: v.number(),
        timeEntryIds: v.optional(v.array(v.id("timeEntries"))),
      }),
    ),
    subtotal: v.number(),
    tax: v.optional(v.number()),
    total: v.number(),
    notes: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const isAdmin = await isOrganizationAdmin(ctx, args.organizationId, args.userId);
    if (!isAdmin) {
      throw forbidden("admin", "Only organization admins can generate invoice PDFs");
    }

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.organizationId !== args.organizationId) {
      throw notFound("invoice", args.invoiceId);
    }

    const invoiceSummary: InvoiceSummary = {
      _id: invoice._id,
      organizationId: invoice.organizationId,
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      lineItems: invoice.lineItems,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      notes: invoice.notes,
    };

    return invoiceSummary;
  },
});

export const setPdfUrlInternal = internalMutation({
  args: {
    invoiceId: v.id("invoices"),
    pdfUrl: v.string(),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw notFound("invoice", args.invoiceId);
    }

    await ctx.db.patch(args.invoiceId, {
      pdfUrl: args.pdfUrl,
      updatedAt: Date.now(),
    });

    return { success: true } as const;
  },
});

export const markPaid = organizationAdminMutation({
  args: {
    invoiceId: v.id("invoices"),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.organizationId !== ctx.organizationId) {
      throw notFound("invoice", args.invoiceId);
    }
    if (invoice.status === "draft") {
      throw conflict("Draft invoices must be sent before marking as paid");
    }

    const now = Date.now();
    await ctx.db.patch(args.invoiceId, {
      status: "paid",
      paidAt: invoice.paidAt ?? now,
      updatedAt: now,
    });

    return { success: true } as const;
  },
});

export const remove = organizationAdminMutation({
  args: {
    invoiceId: v.id("invoices"),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.organizationId !== ctx.organizationId) {
      throw notFound("invoice", args.invoiceId);
    }

    // Clear linked time entries before deleting invoice
    const allTimeEntryIds = invoice.lineItems.flatMap((item) => item.timeEntryIds ?? []);
    if (allTimeEntryIds.length > 0) {
      const now = Date.now();
      await Promise.all(
        allTimeEntryIds.map((entryId) =>
          ctx.db.patch(entryId, {
            billed: false,
            invoiceId: undefined,
            updatedAt: now,
          }),
        ),
      );
    }

    await ctx.db.delete(args.invoiceId);
    return { success: true } as const;
  },
});
