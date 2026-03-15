import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  getCardRecipeClassName,
} from "@/components/ui/Card";
import { Grid } from "@/components/ui/Grid";
import { Stack } from "@/components/ui/Stack";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

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
      <CardContent>
        <Stack gap="lg">
          <Grid cols={1} colsMd={3} gap="sm">
            <Typography variant="small">Invoice: {invoiceNumber}</Typography>
            <Typography variant="small">Issued: {formatDate(issueDate)}</Typography>
            <Typography variant="small">Due: {formatDate(dueDate)}</Typography>
          </Grid>

          <div className={getCardRecipeClassName("invoicePreviewSection")}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((line) => (
                  <TableRow
                    key={`${line.description}-${line.quantity}-${line.rate}-${line.amount}`}
                  >
                    <TableCell>{line.description}</TableCell>
                    <TableCell>{line.quantity.toFixed(2)}h</TableCell>
                    <TableCell>{formatCurrency(line.rate)}</TableCell>
                    <TableCell>{formatCurrency(line.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className={cn(getCardRecipeClassName("invoiceTotalsPanel"), "p-3")}>
            <Stack gap="xs" align="end">
              <Typography variant="small">Subtotal: {formatCurrency(subtotal)}</Typography>
              <Typography variant="small">Tax: {formatCurrency(tax ?? 0)}</Typography>
              <Typography variant="h4">Total: {formatCurrency(total)}</Typography>
            </Stack>
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
        </Stack>
      </CardContent>
    </Card>
  );
}
