import { api } from "@convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
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
type InvoiceListItem = FunctionReturnType<typeof api.invoices.list>[number];

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "paid":
      return "success" as const;
    case "sent":
      return "info" as const;
    case "overdue":
      return "error" as const;
    default:
      return "secondary" as const;
  }
}

function InvoiceCard({ invoice, orgSlug }: { invoice: InvoiceListItem; orgSlug: string }) {
  return (
    <Link to={ROUTES.invoices.detail.path} params={{ orgSlug, invoiceId: invoice._id }}>
      <Card hoverable>
        <CardHeader>
          <Flex align="center" justify="between">
            <CardTitle>{invoice.number}</CardTitle>
            <Badge variant={getStatusBadgeVariant(invoice.status)} shape="pill">
              {invoice.status}
            </Badge>
          </Flex>
        </CardHeader>
        <CardContent>
          <Flex direction="column" gap="sm">
            {invoice.client ? (
              <Typography variant="label">{invoice.client.name}</Typography>
            ) : (
              <Typography variant="small" color="tertiary">
                No client assigned
              </Typography>
            )}
            <Typography variant="h4">{formatCurrency(invoice.total)}</Typography>
            <Metadata>
              <MetadataItem>Due {formatDate(invoice.dueDate, { timeZone: "UTC" })}</MetadataItem>
              <MetadataTimestamp date={invoice.issueDate} prefix="Issued" />
            </Metadata>
          </Flex>
        </CardContent>
      </Card>
    </Link>
  );
}

export const Route = createFileRoute("/_auth/_app/$orgSlug/invoices/")({
  component: InvoicesListPage,
});

function InvoicesListPage() {
  const { orgSlug, organizationId } = useOrganization();
  const [status, setStatus] = useState<InvoiceStatusFilter>("all");

  const { mutate: createInvoice } = useAuthenticatedMutation(api.invoices.create);
  const invoices = useAuthenticatedQuery(api.invoices.list, {
    organizationId,
    status: status === "all" ? undefined : status,
  });

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
        <Grid cols={1} colsLg={2} gap="md">
          {invoices.map((invoice) => (
            <InvoiceCard key={invoice._id} invoice={invoice} orgSlug={orgSlug} />
          ))}
        </Grid>
      )}
    </PageLayout>
  );
}
