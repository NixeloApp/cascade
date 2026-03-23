import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatDate } from "@/lib/formatting";
import { FileText } from "@/lib/icons";
import { WEEK } from "@/lib/time";
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

  const { mutate: createInvoice } = useAuthenticatedMutation(api.invoices.create);
  const invoices = useAuthenticatedQuery(api.invoices.list, {
    organizationId,
    status: status === "all" ? undefined : status,
  }) as Doc<"invoices">[] | undefined;

  const handleCreateDraft = async () => {
    try {
      await createInvoice({
        organizationId,
        issueDate: Date.now(),
        dueDate: Date.now() + WEEK,
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
          <Flex align="center" gap="sm">
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as InvoiceStatusFilter)}
            >
              <SelectTrigger className="w-36" aria-label="Invoice status filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateDraft}>New draft</Button>
          </Flex>
        }
      />

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={status === "all" ? "No invoices yet" : `No ${status} invoices`}
          description={
            status === "all"
              ? "Create a draft invoice to get started with billing."
              : `No invoices match the "${status}" filter.`
          }
          action={
            status === "all"
              ? { label: "New draft", onClick: handleCreateDraft }
              : { label: "Clear filter", onClick: () => setStatus("all") }
          }
        />
      ) : (
        <Grid cols={1} gap="md" className="lg:grid-cols-2">
          {invoices.map((invoice: Doc<"invoices">) => (
            <Card key={invoice._id}>
              <CardHeader>
                <CardTitle>{invoice.number}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                <Typography variant="small">Status: {invoice.status}</Typography>
                <Typography variant="small">Total: {formatCurrency(invoice.total)}</Typography>
                <Typography variant="small" color="secondary">
                  Due: {formatDate(invoice.dueDate, { timeZone: "UTC" })}
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
        </Grid>
      )}
    </PageLayout>
  );
}
