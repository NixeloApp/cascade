import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { InvoicePdfTemplate } from "./InvoicePdfTemplate";

describe("InvoicePdfTemplate", () => {
  const issueDate = Date.UTC(2026, 0, 15);
  const dueDate = Date.UTC(2026, 0, 30);

  it("renders invoice metadata, line items, totals, notes, and pdf link", () => {
    render(
      <InvoicePdfTemplate
        invoiceNumber="INV-2026-001"
        issueDate={issueDate}
        dueDate={dueDate}
        lineItems={[
          { description: "Design review", quantity: 2, rate: 125, amount: 250 },
          { description: "Implementation", quantity: 3.5, rate: 200, amount: 700 },
        ]}
        subtotal={950}
        tax={95}
        total={1045}
        notes="Payment due within 15 days."
        pdfUrl="https://example.com/invoices/inv-2026-001.pdf"
      />,
    );

    expect(screen.getByText("Invoice: INV-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Issued: 2026-01-15")).toBeInTheDocument();
    expect(screen.getByText("Due: 2026-01-30")).toBeInTheDocument();

    expect(screen.getByText("Design review")).toBeInTheDocument();
    expect(screen.getByText("2.00h")).toBeInTheDocument();
    expect(screen.getByText("3.50h")).toBeInTheDocument();
    expect(screen.getByText("Subtotal: $950.00")).toBeInTheDocument();
    expect(screen.getByText("Tax: $95.00")).toBeInTheDocument();
    expect(screen.getByText("Total: $1,045.00")).toBeInTheDocument();
    expect(screen.getByText("Notes: Payment due within 15 days.")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Open generated PDF" })).toHaveAttribute(
      "href",
      "https://example.com/invoices/inv-2026-001.pdf",
    );
  });

  it("shows zero tax and the empty pdf state when optional fields are omitted", () => {
    render(
      <InvoicePdfTemplate
        invoiceNumber="INV-2026-002"
        issueDate={issueDate}
        dueDate={dueDate}
        lineItems={[{ description: "Support", quantity: 1, rate: 80, amount: 80 }]}
        subtotal={80}
        total={80}
      />,
    );

    expect(screen.getByText("Tax: $0.00")).toBeInTheDocument();
    expect(screen.getByText("No PDF generated yet.")).toBeInTheDocument();
    expect(screen.queryByText(/^Notes:/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open generated PDF" })).not.toBeInTheDocument();
  });
});
