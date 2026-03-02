"use node";

/**
 * Invoice Actions (Node.js runtime)
 *
 * Actions that require Node.js APIs (e.g., Blob from node:buffer).
 */

import { Blob } from "node:buffer";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { conflict, forbidden } from "./lib/errors";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
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

function buildMinimalPdfFromText(text: string): Blob {
  const escapedText = text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .split("\n");

  const startY = 780;
  const lineHeight = 16;
  const content = escapedText
    .map(
      (line: string, index: number) =>
        `BT /F1 12 Tf 50 ${startY - index * lineHeight} Td (${line}) Tj ET`,
    )
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
    // Cast Node.js Blob to Web Blob for Convex storage
    const storageId = await ctx.storage.store(pdfBlob as unknown as globalThis.Blob);
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
