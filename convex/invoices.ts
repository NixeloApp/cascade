/**
 * Agency Invoices
 *
 * Base CRUD for organization-scoped invoices.
 */

import { Blob } from "node:buffer";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, type QueryCtx } from "./_generated/server";
import { organizationAdminMutation, organizationQuery } from "./customFunctions";
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

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function buildInvoiceSummaryText(invoice: {
  number: string;
  issueDate: number;
  dueDate: number;
  lineItems: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
}) {
  const lines = [
    `Invoice ${invoice.number}`,
    `Issued: ${new Date(invoice.issueDate).toISOString().slice(0, 10)}`,
    `Due: ${new Date(invoice.dueDate).toISOString().slice(0, 10)}`,
    "",
    "Line Items:",
    ...invoice.lineItems.map(
      (line, index) =>
        `${index + 1}. ${line.description} - ${line.quantity.toFixed(2)}h x ${formatCurrency(line.rate)} = ${formatCurrency(line.amount)}`,
    ),
    "",
    `Subtotal: ${formatCurrency(invoice.subtotal)}`,
    `Tax: ${formatCurrency(invoice.tax ?? 0)}`,
    `Total: ${formatCurrency(invoice.total)}`,
  ];

  if (invoice.notes) {
    lines.push("", `Notes: ${invoice.notes}`);
  }

  return lines.join("\n");
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

function buildMinimalPdfFromText(text: string): Blob {
  const escapedText = text
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .split("\n");

  const startY = 780;
  const lineHeight = 16;
  const content = escapedText
    .map((line, index) => `BT /F1 12 Tf 50 ${startY - index * lineHeight} Td (${line}) Tj ET`)
    .join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
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
  // Use bounded query to count invoices - cap at reasonable limit for sequence calculation
  const MAX_INVOICE_COUNT = 10000;
  const invoices = await ctx.db
    .query("invoices")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
    .take(MAX_INVOICE_COUNT);

  const sequence = invoices.length + 1;
  const year = new Date().getUTCFullYear();
  return `INV-${year}-${String(sequence).padStart(3, "0")}`;
}

async function getUnbilledBillableEntries(
  ctx: Pick<QueryCtx, "db">,
  organizationId: Id<"organizations">,
  startDate: number,
  endDate: number,
  userId?: Id<"users">,
  projectId?: Id<"projects">,
) {
  const entries = await ctx.db
    .query("timeEntries")
    .withIndex("by_date", (q) => q.gte("date", startDate).lte("date", endDate))
    .collect();

  const candidateEntries = entries.filter(
    (entry) =>
      entry.billable &&
      !entry.billed &&
      entry.endTime !== undefined &&
      entry.projectId !== undefined &&
      (userId === undefined || entry.userId === userId) &&
      (projectId === undefined || entry.projectId === projectId),
  );

  const projectIds = [...new Set(candidateEntries.map((entry) => entry.projectId).filter(Boolean))];
  const projects = await Promise.all(projectIds.map((id) => ctx.db.get(id)));
  const projectOrgMap = new Map(
    projects.filter(Boolean).map((project) => [project._id, project.organizationId]),
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

export const generatePdf = action({
  args: {
    organizationId: v.id("organizations"),
    invoiceId: v.id("invoices"),
  },
  returns: v.object({
    success: v.literal(true),
    pdfUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw forbidden();
    }

    const invoice = await ctx.runQuery(internal.invoices.getInvoiceForPdfGeneration, {
      organizationId: args.organizationId,
      invoiceId: args.invoiceId,
      userId,
    });

    const summaryText = buildInvoiceSummaryText(invoice);
    const pdfBlob = buildMinimalPdfFromText(summaryText);
    const storageId = await ctx.storage.store(pdfBlob);
    const pdfUrl = await ctx.storage.getUrl(storageId);
    if (!pdfUrl) {
      throw conflict("Unable to generate a public PDF URL for this invoice");
    }

    await ctx.runMutation(internal.invoices.setPdfUrlInternal, {
      invoiceId: args.invoiceId,
      pdfUrl,
    });

    return { success: true, pdfUrl } as const;
  },
});

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
