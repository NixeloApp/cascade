import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { InvoiceEditor } from "@/components/Invoices/InvoiceEditor";
import { InvoicePdfTemplate } from "@/components/Invoices/InvoicePdfTemplate";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_auth/_app/$orgSlug/invoices/$invoiceId")({
  component: InvoiceDetailPage,
});

function InvoiceDetailPage() {
  const { invoiceId } = Route.useParams();
  const { organizationId } = useOrganization();
  const typedInvoiceId = invoiceId as Id<"invoices">;

  const [isSavingEditor, setIsSavingEditor] = useState(false);

  const invoice = useQuery(api.invoices.get, {
    organizationId,
    invoiceId: typedInvoiceId,
  }) as Doc<"invoices"> | undefined;
  const updateInvoice = useMutation(api.invoices.update);
  const sendInvoice = useMutation(api.invoices.send);
  const markPaid = useMutation(api.invoices.markPaid);
  const generatePdf = useAction(api.invoicesActions.generatePdf);

  if (!invoice) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  const saveLineItems = async (
    lineItems: Array<{ description: string; quantity: number; rate: number }>,
  ) => {
    setIsSavingEditor(true);
    try {
      // Merge timeEntryIds from original line items to preserve time entry links
      const lineItemsWithEntryIds = lineItems.map((line, index) => ({
        ...line,
        timeEntryIds: invoice.lineItems[index]?.timeEntryIds,
      }));
      await updateInvoice({
        organizationId,
        invoiceId: typedInvoiceId,
        lineItems: lineItemsWithEntryIds,
      });
      showSuccess("Invoice line items saved");
    } catch (error) {
      showError(error, "Failed to save invoice line items");
    } finally {
      setIsSavingEditor(false);
    }
  };

  const handleGeneratePdf = async () => {
    try {
      await generatePdf({ organizationId, invoiceId: typedInvoiceId });
      showSuccess("Invoice PDF generated");
    } catch (error) {
      showError(error, "Failed to generate invoice PDF");
    }
  };

  const handleSend = async () => {
    try {
      await sendInvoice({ organizationId, invoiceId: typedInvoiceId });
      showSuccess("Invoice marked as sent");
    } catch (error) {
      showError(error, "Failed to send invoice");
    }
  };

  const handleMarkPaid = async () => {
    try {
      await markPaid({ organizationId, invoiceId: typedInvoiceId });
      showSuccess("Invoice marked as paid");
    } catch (error) {
      showError(error, "Failed to mark invoice as paid");
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title={invoice.number}
        description={`Status: ${invoice.status}`}
        actions={
          <Flex align="center" gap="sm">
            <Button variant="secondary" onClick={handleGeneratePdf}>
              Generate PDF
            </Button>
            <Button variant="secondary" onClick={handleSend} disabled={invoice.status === "paid"}>
              Mark Sent
            </Button>
            <Button onClick={handleMarkPaid} disabled={invoice.status === "draft"}>
              Mark Paid
            </Button>
          </Flex>
        }
      />

      <div className="space-y-4">
        <Typography variant="small" color="secondary">
          Issue date: {new Date(invoice.issueDate).toISOString().slice(0, 10)} · Due date:{" "}
          {new Date(invoice.dueDate).toISOString().slice(0, 10)}
        </Typography>

        <InvoicePdfTemplate
          invoiceNumber={invoice.number}
          issueDate={invoice.issueDate}
          dueDate={invoice.dueDate}
          lineItems={invoice.lineItems}
          subtotal={invoice.subtotal}
          tax={invoice.tax}
          total={invoice.total}
          notes={invoice.notes}
          pdfUrl={invoice.pdfUrl}
        />

        <InvoiceEditor
          initialLineItems={invoice.lineItems.map((line: Doc<"invoices">["lineItems"][number]) => ({
            description: line.description,
            quantity: line.quantity,
            rate: line.rate,
            timeEntryIds: line.timeEntryIds,
          }))}
          onSave={saveLineItems}
          isSaving={isSavingEditor}
        />
      </div>
    </PageLayout>
  );
}
