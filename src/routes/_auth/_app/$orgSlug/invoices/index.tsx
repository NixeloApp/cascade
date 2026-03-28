import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { PageHeader, PageLayout } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Input } from "@/components/ui/form/Input";
import { Grid } from "@/components/ui/Grid";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
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
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatCurrency, formatDate, formatDateForInput } from "@/lib/formatting";
import { FileText } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { DAY, WEEK } from "@/lib/time";
import { showError, showSuccess } from "@/lib/toast";

type InvoiceStatusFilter = "all" | "draft" | "sent" | "paid" | "overdue";
type InvoiceListItem = FunctionReturnType<typeof api.invoices.list>[number];

const NO_CLIENT = "__none__";
const INVOICE_STATUS_OPTIONS: Array<{ label: string; value: InvoiceStatusFilter }> = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

function getInvoiceStatusOptionTestId(status: InvoiceStatusFilter) {
  switch (status) {
    case "all":
      return TEST_IDS.INVOICES.STATUS_FILTER_OPTION_ALL;
    case "draft":
      return TEST_IDS.INVOICES.STATUS_FILTER_OPTION_DRAFT;
    case "sent":
      return TEST_IDS.INVOICES.STATUS_FILTER_OPTION_SENT;
    case "paid":
      return TEST_IDS.INVOICES.STATUS_FILTER_OPTION_PAID;
    case "overdue":
      return TEST_IDS.INVOICES.STATUS_FILTER_OPTION_OVERDUE;
  }
}

export function getInvoiceEmptyStateConfig(args: {
  onClearFilter: () => void;
  onCreateDraft: () => void;
  status: InvoiceStatusFilter;
}) {
  return {
    action:
      args.status === "all"
        ? { label: "New draft", onClick: args.onCreateDraft }
        : { label: "Clear filter", onClick: args.onClearFilter },
    description:
      args.status === "all"
        ? "Create a draft invoice to get started with billing."
        : `No invoices match the "${args.status}" filter.`,
    testId:
      args.status === "all"
        ? TEST_IDS.INVOICES.EMPTY_STATE
        : TEST_IDS.INVOICES.FILTERED_EMPTY_STATE,
    title: args.status === "all" ? "No invoices yet" : `No ${args.status} invoices`,
  };
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

function getInvoiceClientLabel(invoice: InvoiceListItem) {
  return invoice.client?.name ?? "No client";
}

function InvoiceStatusBadge({ status }: { status: InvoiceListItem["status"] }) {
  return (
    <Badge variant={getStatusBadgeVariant(status)} shape="pill" size="sm">
      {status}
    </Badge>
  );
}

function InvoiceMetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ui-border-secondary bg-ui-bg-secondary px-3 py-2">
      <Typography variant="small" color="tertiary" className="block">
        {label}
      </Typography>
      <Typography variant="label" className="mt-1 block">
        {value}
      </Typography>
    </div>
  );
}

function InvoiceMobileCard({ invoice, orgSlug }: { invoice: InvoiceListItem; orgSlug: string }) {
  return (
    <div className="border-b border-ui-border-primary p-4 last:border-b-0">
      <Stack gap="sm">
        <Flex align="start" justify="between" gap="sm">
          <Stack gap="xs" className="min-w-0 flex-1">
            <Link to={ROUTES.invoices.detail.path} params={{ orgSlug, invoiceId: invoice._id }}>
              <Typography variant="label" color="brand">
                {invoice.number}
              </Typography>
            </Link>
            <Typography variant="small" color="secondary">
              {getInvoiceClientLabel(invoice)}
            </Typography>
          </Stack>
          <InvoiceStatusBadge status={invoice.status} />
        </Flex>

        <Grid cols={2} gap="sm">
          <InvoiceMetricBlock label="Total" value={formatCurrency(invoice.total)} />
          <InvoiceMetricBlock
            label="Due"
            value={formatDate(invoice.dueDate, { timeZone: "UTC" })}
          />
        </Grid>
      </Stack>
    </div>
  );
}

function InvoiceTable({ invoices, orgSlug }: { invoices: InvoiceListItem[]; orgSlug: string }) {
  return (
    <Card padding="none" data-testid={TEST_IDS.INVOICES.CONTENT}>
      <div className="md:hidden" data-testid={TEST_IDS.INVOICES.MOBILE_LIST}>
        {invoices.map((invoice) => (
          <InvoiceMobileCard key={invoice._id} invoice={invoice} orgSlug={orgSlug} />
        ))}
      </div>

      <div className="hidden md:block">
        <Table data-testid={TEST_IDS.INVOICES.TABLE}>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice._id}>
                <TableCell>
                  <Link
                    to={ROUTES.invoices.detail.path}
                    params={{ orgSlug, invoiceId: invoice._id }}
                  >
                    <Typography variant="label" color="brand">
                      {invoice.number}
                    </Typography>
                  </Link>
                </TableCell>
                <TableCell>
                  <Typography variant="small">{getInvoiceClientLabel(invoice)}</Typography>
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Typography variant="label">{formatCurrency(invoice.total)}</Typography>
                </TableCell>
                <TableCell className="text-right">
                  <Typography variant="small" color="secondary">
                    {formatDate(invoice.dueDate, { timeZone: "UTC" })}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function InvoicesLoadingState() {
  return (
    <Card padding="none" data-testid={TEST_IDS.INVOICES.LOADING_STATE}>
      <div className="md:hidden" aria-hidden="true">
        {["invoice-loading-row-1", "invoice-loading-row-2", "invoice-loading-row-3"].map(
          (rowId) => (
            <div key={rowId} className="border-b border-ui-border-primary p-4 last:border-b-0">
              <Stack gap="sm">
                <Flex align="start" justify="between" gap="sm">
                  <Stack gap="xs" className="min-w-0 flex-1">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-24" />
                  </Stack>
                  <Skeleton className="h-5 w-16" />
                </Flex>
                <Grid cols={2} gap="sm">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </Grid>
              </Stack>
            </div>
          ),
        )}
      </div>

      <div className="hidden md:block">
        <Table aria-hidden="true">
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {["invoice-loading-row-1", "invoice-loading-row-2", "invoice-loading-row-3"].map(
              (rowId) => (
                <TableRow key={rowId}>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Flex justify="end">
                      <Skeleton className="h-4 w-20" />
                    </Flex>
                  </TableCell>
                  <TableCell className="text-right">
                    <Flex justify="end">
                      <Skeleton className="h-4 w-24" />
                    </Flex>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
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
      data-testid={TEST_IDS.INVOICES.CREATE_DIALOG}
    >
      <Stack gap="md">
        {clients && clients.length > 0 ? (
          <div>
            <Typography variant="label" className="mb-1 block">
              Client
            </Typography>
            <Select
              ariaLabel="Select client"
              onChange={setClientId}
              options={[
                { value: NO_CLIENT, label: "No client" },
                ...clients.map((client) => ({ value: client._id, label: client.name })),
              ]}
              placeholder="Select a client"
              value={clientId}
            />
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

export function InvoicesListPage() {
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
  const isLoading = invoices === undefined;

  const handleCreated = (invoiceId: Id<"invoices">) => {
    navigate({
      to: ROUTES.invoices.detail.path,
      params: { orgSlug, invoiceId },
    });
  };
  const emptyState = getInvoiceEmptyStateConfig({
    onClearFilter: () => setStatus("all"),
    onCreateDraft: () => setShowCreateDialog(true),
    status,
  });

  return (
    <PageLayout>
      <PageHeader
        title="Invoices"
        description="Create, track, and deliver agency invoices."
        actions={
          <Flex align="center" gap="sm">
            <Select
              disabled={isLoading}
              ariaLabel="Invoice status filter"
              onChange={(value) => setStatus(value as InvoiceStatusFilter)}
              options={INVOICE_STATUS_OPTIONS.map((option) => ({
                ...option,
                testId: getInvoiceStatusOptionTestId(option.value),
              }))}
              placeholder="All statuses"
              testId={TEST_IDS.INVOICES.STATUS_FILTER}
              value={status}
              width="sm"
            />
            <Button
              onClick={() => setShowCreateDialog(true)}
              disabled={isLoading}
              data-testid={TEST_IDS.INVOICES.NEW_DRAFT_BUTTON}
            >
              New draft
            </Button>
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

      {isLoading ? (
        <InvoicesLoadingState />
      ) : invoices.length === 0 ? (
        <EmptyState
          data-testid={emptyState.testId}
          icon={FileText}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      ) : (
        <InvoiceTable invoices={invoices} orgSlug={orgSlug} />
      )}
    </PageLayout>
  );
}
