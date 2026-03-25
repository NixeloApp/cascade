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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
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
const INVOICES_E2E_STATE_STORAGE_KEY = "nixelo:e2e:invoices-state";

declare global {
  interface Window {
    __NIXELO_E2E_INVOICES_LOADING__?: boolean;
  }
}

type InvoicesE2EState = "create-dialog" | "filtered-empty";

function isE2EInvoicesLoadingOverrideEnabled(): boolean {
  return typeof window !== "undefined" && window.__NIXELO_E2E_INVOICES_LOADING__ === true;
}

function consumeInvoicesE2ERequestedState(): {
  showCreateDialog: boolean;
  status: InvoiceStatusFilter;
} {
  const defaultState = {
    showCreateDialog: false,
    status: "all" as InvoiceStatusFilter,
  };

  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const requestedState = window.sessionStorage.getItem(INVOICES_E2E_STATE_STORAGE_KEY);
    window.sessionStorage.removeItem(INVOICES_E2E_STATE_STORAGE_KEY);

    if ((requestedState as InvoicesE2EState | null) === "filtered-empty") {
      return {
        showCreateDialog: false,
        status: "overdue",
      };
    }

    if ((requestedState as InvoicesE2EState | null) === "create-dialog") {
      return {
        showCreateDialog: true,
        status: "all",
      };
    }
  } catch {
    return defaultState;
  }

  return defaultState;
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

function InvoiceTable({ invoices, orgSlug }: { invoices: InvoiceListItem[]; orgSlug: string }) {
  return (
    <Card padding="none" data-testid={TEST_IDS.INVOICES.CONTENT}>
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
                <Link to={ROUTES.invoices.detail.path} params={{ orgSlug, invoiceId: invoice._id }}>
                  <Typography variant="label" color="brand">
                    {invoice.number}
                  </Typography>
                </Link>
              </TableCell>
              <TableCell>
                {invoice.client ? (
                  <Typography variant="small">{invoice.client.name}</Typography>
                ) : (
                  <Typography variant="small" color="tertiary">
                    —
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(invoice.status)} shape="pill" size="sm">
                  {invoice.status}
                </Badge>
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
    </Card>
  );
}

function InvoicesLoadingState() {
  return (
    <Card padding="none" data-testid={TEST_IDS.INVOICES.LOADING_STATE}>
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

export function InvoicesListPage() {
  const { orgSlug, organizationId } = useOrganization();
  const navigate = useNavigate();
  const [initialState] = useState(consumeInvoicesE2ERequestedState);
  const [status, setStatus] = useState<InvoiceStatusFilter>(initialState.status);
  const [showCreateDialog, setShowCreateDialog] = useState(initialState.showCreateDialog);

  const invoices = useAuthenticatedQuery(api.invoices.list, {
    organizationId,
    status: status === "all" ? undefined : status,
  });
  const clients = useAuthenticatedQuery(api.clients.list, { organizationId }) as
    | Doc<"clients">[]
    | undefined;
  const isLoading = isE2EInvoicesLoadingOverrideEnabled() || invoices === undefined;

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
              value={status}
              onValueChange={(value) => setStatus(value as InvoiceStatusFilter)}
              disabled={isLoading}
            >
              <SelectTrigger
                width="sm"
                aria-label="Invoice status filter"
                data-testid={TEST_IDS.INVOICES.STATUS_FILTER}
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {INVOICE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateDialog(true)} disabled={isLoading}>
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
