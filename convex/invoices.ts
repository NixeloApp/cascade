/**
 * Agency Invoices
 *
 * Base CRUD for organization-scoped invoices.
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { organizationAdminMutation, organizationQuery } from "./customFunctions";
import { conflict, notFound, validation } from "./lib/errors";

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

function normalizeLineItems(lineItems: InvoiceLineItemInput[]) {
  return lineItems.map((item) => {
    if (item.quantity <= 0) {
      throw validation("lineItems", "Line item quantity must be greater than zero");
    }
    if (item.rate < 0) {
      throw validation("lineItems", "Line item rate must be zero or greater");
    }
    return {
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.quantity * item.rate,
      timeEntryIds: item.timeEntryIds,
    };
  });
}

function calculateTotals(lineItems: ReturnType<typeof normalizeLineItems>, tax?: number) {
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
  const invoices = await ctx.db
    .query("invoices")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
    .collect();

  const sequence = invoices.length + 1;
  const year = new Date().getUTCFullYear();
  return `INV-${year}-${String(sequence).padStart(3, "0")}`;
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

    const invoices = args.status
      ? await ctx.db
          .query("invoices")
          .withIndex("by_status", (q) =>
            q.eq("organizationId", ctx.organizationId).eq("status", args.status),
          )
          .order("desc")
          .collect()
      : await ctx.db
          .query("invoices")
          .withIndex("by_organization", (q) => q.eq("organizationId", ctx.organizationId))
          .order("desc")
          .collect();

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

    await ctx.db.delete(args.invoiceId);
    return { success: true } as const;
  },
});
