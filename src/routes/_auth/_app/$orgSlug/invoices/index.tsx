import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Input } from "@/components/ui/form/Input";
import { Grid } from "@/components/ui/Grid";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatCurrency, formatDate, formatDateForInput } from "@/lib/formatting";
import { FileText } from "@/lib/icons";
import { DAY, WEEK } from "@/lib/time";
import { showError, showSuccess } from "@/lib/toast";

type InvoiceStatusFilter = "all" | "draft" | "sent" | "paid" | "overdue";
type InvoiceListItem = FunctionReturnType<typeof api.invoices.list>[number];

const NO_CLIENT = "__none__";

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

function CreateDraftDialog({
  clients,
  isOpen,
  onClose,
  onCreated,
  organizationId,
}: {
  clients: Doc<"clients">[] | undefined;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (invoiceId: Id<"invoices">) => void;
  organizationId: Id<"organizations">;
}) {
  const { mutate: createInvoice } = useAuthenticatedMutation(api.invoices.create);
  const [clientId, setClientId] = useState(NO_CLIENT);
  const [issueDate, setIssueDate] = useState(formatDateForInput(Date.now()));
  const [dueDate, setDueDate] = useState(formatDateForInput(Date.now() + WEEK));
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setClientId(NO_CLIENT);
    setIssueDate(formatDateForInput(Date.now()));
    setDueDate(formatDateForInput(Date.now() + WEEK));
    setDescription("");
    setRate("");
  };

  const handleSubmit = async () => {
    const issueDateMs = new Date(issueDate).getTime();
    const dueDateMs = new Date(dueDate).getTime();

    if (Number.isNaN(issueDateMs) || Number.isNaN(dueDateMs)) {
      showError("Please enter valid dates.");
      return;
    }

    if (dueDateMs < issueDateMs) {
      showError("Due date must be on or after the issue date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const lineDescription = description.trim() || "Services rendered";
      const lineRate = Number.parseFloat(rate) || 0;
      const result = await createInvoice({
        organizationId,
        clientId: clientId !== NO_CLIENT ? (clientId as Id<"clients">) : undefined,
        issueDate: issueDateMs,
        dueDate: dueDateMs + DAY - 1,
        lineItems: [{ description: lineDescription, quantity: 1, rate: lineRate }],
      });
      showSuccess("Draft invoice created");
      resetForm();
      onClose();
      onCreated(result.invoiceId);
    } catch (error) {
      showError(error, "Failed to create draft invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
      title="Create Draft Invoice"
      description="Set up a new draft invoice. You can add more line items after creation."
      size="md"
    >
      <Stack gap="md">
        {clients && clients.length > 0 ? (
          <div>
            <Typography variant="label" className="mb-1 block">
              Client
            </Typography>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger aria-label="Select client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CLIENT}>No client</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <Grid cols={1} colsMd={2} gap="sm">
          <Input
            label="Issue date"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Grid>

        <Input
          label="First line item"
          placeholder="Services rendered"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Input
          label="Rate ($)"
          type="number"
          min={0}
          step={0.01}
          placeholder="0.00"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />

        <Flex justify="end" gap="sm">
          <Button
            variant="secondary"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Create Draft
          </Button>
        </Flex>
      </Stack>
    </Dialog>
  );
}

export const Route = createFileRoute("/_auth/_app/$orgSlug/invoices/")({
  component: InvoicesListPage,
});

function InvoicesListPage() {
  const { orgSlug, organizationId } = useOrganization();
  const navigate = useNavigate();
  const [status, setStatus] = useState<InvoiceStatusFilter>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const invoices = useAuthenticatedQuery(api.invoices.list, {
    organizationId,
    status: status === "all" ? undefined : status,
  });
  const clients = useAuthenticatedQuery(api.clients.list, { organizationId }) as
    | Doc<"clients">[]
    | undefined;

  const handleCreated = (invoiceId: Id<"invoices">) => {
    navigate({
      to: ROUTES.invoices.detail.path,
      params: { orgSlug, invoiceId },
    });
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
            <Button onClick={() => setShowCreateDialog(true)}>New draft</Button>
          </Flex>
        }
      />

      <CreateDraftDialog
        clients={clients}
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={handleCreated}
        organizationId={organizationId}
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
              ? { label: "New draft", onClick: () => setShowCreateDialog(true) }
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
