import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Grid } from "@/components/ui/Grid";
import { Typography } from "@/components/ui/Typography";

type InvoiceLineItem = {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};

interface InvoicePdfTemplateProps {
  invoiceNumber: string;
  issueDate: number;
  dueDate: number;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
  pdfUrl?: string;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

/**
 * Renders the invoice PDF preview layout from normalized invoice data.
 */
export function InvoicePdfTemplate({
  invoiceNumber,
  issueDate,
  dueDate,
  lineItems,
  subtotal,
  tax,
  total,
  notes,
  pdfUrl,
}: InvoicePdfTemplateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>PDF Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Grid cols={1} gap="sm" className="md:grid-cols-3">
          <Typography variant="small">Invoice: {invoiceNumber}</Typography>
          <Typography variant="small">Issued: {formatDate(issueDate)}</Typography>
          <Typography variant="small">Due: {formatDate(dueDate)}</Typography>
        </Grid>

        <div className="space-y-2 rounded-lg border border-ui-border p-3">
          {lineItems.map((line) => (
            <Grid
              key={`${line.description}-${line.quantity}-${line.rate}-${line.amount}`}
              gap="sm"
              className="grid-cols-[2fr_1fr_1fr_1fr]"
            >
              <Typography variant="small">{line.description}</Typography>
              <Typography variant="small" color="secondary">
                {line.quantity.toFixed(2)}h
              </Typography>
              <Typography variant="small" color="secondary">
                {formatCurrency(line.rate)}
              </Typography>
              <Typography variant="small">{formatCurrency(line.amount)}</Typography>
            </Grid>
          ))}
        </div>

        <div className="space-y-1">
          <Typography variant="small">Subtotal: {formatCurrency(subtotal)}</Typography>
          <Typography variant="small">Tax: {formatCurrency(tax ?? 0)}</Typography>
          <Typography variant="h4">Total: {formatCurrency(total)}</Typography>
        </div>

        {notes ? <Typography variant="small">Notes: {notes}</Typography> : null}
        {pdfUrl ? (
          <Button variant="link" size="sm" asChild>
            <a href={pdfUrl} target="_blank" rel="noreferrer">
              Open generated PDF
            </a>
          </Button>
        ) : (
          <Typography variant="small" color="secondary">
            No PDF generated yet.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
