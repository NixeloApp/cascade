import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";

type InvoiceStatusFilter = "all" | "draft" | "sent" | "paid" | "overdue";

export const Route = createFileRoute("/_auth/_app/$orgSlug/invoices/")({
  component: InvoicesListPage,
});

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function InvoicesListPage() {
  const { orgSlug, organizationId } = useOrganization();
  const [status, setStatus] = useState<InvoiceStatusFilter>("all");

  const createInvoice = useMutation(api.invoices.create);
  const invoices = useQuery(api.invoices.list, {
    organizationId,
    status: status === "all" ? undefined : status,
  }) as Doc<"invoices">[] | undefined;

  const handleCreateDraft = async () => {
    try {
      await createInvoice({
        organizationId,
        issueDate: Date.now(),
        dueDate: Date.now() + 7 * 86400000,
        lineItems: [{ description: "New line item", quantity: 1, rate: 0 }],
      });
      showSuccess("Draft invoice created");
    } catch (error) {
      showError(error, "Failed to create draft invoice");
    }
  };

  if (!invoices) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  return (
    <PageLayout>
      <PageHeader
        title="Invoices"
        description="Create, track, and deliver agency invoices."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as InvoiceStatusFilter)}
              className="h-10 rounded-lg border border-ui-border bg-ui-bg px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <Button onClick={handleCreateDraft}>New draft</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {invoices.map((invoice: Doc<"invoices">) => (
          <Card key={invoice._id}>
            <CardHeader>
              <CardTitle>{invoice.number}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              <Typography variant="small">Status: {invoice.status}</Typography>
              <Typography variant="small">Total: {formatCurrency(invoice.total)}</Typography>
              <Typography variant="small" color="secondary">
                Due: {new Date(invoice.dueDate).toISOString().slice(0, 10)}
              </Typography>
              <Link
                to={ROUTES.invoices.detail.path}
                params={{ orgSlug, invoiceId: invoice._id }}
                className="text-brand underline text-sm"
              >
                Open invoice
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
