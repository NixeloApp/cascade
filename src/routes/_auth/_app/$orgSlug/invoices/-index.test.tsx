import type { Doc, Id } from "@convex/_generated/dataModel";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { getInvoiceEmptyStateConfig, InvoicesListPage } from "./index";

declare global {
  interface Window {
    __NIXELO_E2E_INVOICES_LOADING__?: boolean;
  }
}

type InvoiceListItem = Doc<"invoices"> & {
  client: { company?: string; name: string } | null;
};

const mockNavigate = vi.fn();
const mockCreateInvoice = Object.assign(vi.fn(), { withOptimisticUpdate: vi.fn() });
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseOrganization = vi.mocked(useOrganization);

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
  createFileRoute: () => () => ({}),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const ORGANIZATION_ID = "org-1" as Id<"organizations">;
const CLIENT_ID = "client-1" as Id<"clients">;
const CREATED_INVOICE_ID = "invoice-created" as Id<"invoices">;

const CLIENTS: Doc<"clients">[] = [
  {
    _creationTime: Date.now() - 60_000,
    _id: CLIENT_ID,
    address: "18 Market Street, Chicago, IL",
    company: "Northstar Labs",
    createdBy: "user-1" as Id<"users">,
    email: "portal-screenshots@nixelo.test",
    hourlyRate: 185,
    name: "Northstar Labs",
    organizationId: ORGANIZATION_ID,
    updatedAt: Date.now() - 60_000,
  },
];

const INVOICES: InvoiceListItem[] = [
  {
    _creationTime: Date.now() - 30_000,
    _id: "invoice-1" as Id<"invoices">,
    client: { name: "Northstar Labs" },
    clientId: CLIENT_ID,
    createdBy: "user-1" as Id<"users">,
    dueDate: Date.UTC(2026, 2, 28),
    issueDate: Date.UTC(2026, 2, 14),
    lineItems: [{ amount: 2400, description: "Discovery workshop", quantity: 1, rate: 2400 }],
    notes: undefined,
    number: "INV-2026-901",
    organizationId: ORGANIZATION_ID,
    paidAt: undefined,
    pdfUrl: undefined,
    sentAt: undefined,
    status: "draft",
    subtotal: 2400,
    tax: undefined,
    total: 2400,
    updatedAt: Date.now() - 30_000,
  },
  {
    _creationTime: Date.now() - 20_000,
    _id: "invoice-2" as Id<"invoices">,
    client: null,
    clientId: undefined,
    createdBy: "user-1" as Id<"users">,
    dueDate: Date.UTC(2026, 3, 4),
    issueDate: Date.UTC(2026, 2, 21),
    lineItems: [{ amount: 1250, description: "Strategy review", quantity: 1, rate: 1250 }],
    notes: undefined,
    number: "INV-2026-902",
    organizationId: ORGANIZATION_ID,
    paidAt: undefined,
    pdfUrl: undefined,
    sentAt: Date.now() - 10_000,
    status: "sent",
    subtotal: 1250,
    tax: undefined,
    total: 1250,
    updatedAt: Date.now() - 20_000,
  },
];

function mockInvoiceQueries(args?: {
  clients?: Doc<"clients">[] | undefined;
  invoices?: InvoiceListItem[] | undefined;
}) {
  const clients = args?.clients ?? CLIENTS;
  const invoices = args?.invoices ?? INVOICES;
  let callIndex = 0;

  mockUseAuthenticatedQuery.mockImplementation(() => {
    const result = callIndex % 2 === 0 ? invoices : clients;
    callIndex += 1;
    return result;
  });
}

describe("InvoicesListPage", () => {
  beforeEach(() => {
    if (!Element.prototype.hasPointerCapture) {
      Object.defineProperty(Element.prototype, "hasPointerCapture", {
        configurable: true,
        value: () => false,
      });
    }
    if (!Element.prototype.releasePointerCapture) {
      Object.defineProperty(Element.prototype, "releasePointerCapture", {
        configurable: true,
        value: () => undefined,
      });
    }

    delete window.__NIXELO_E2E_INVOICES_LOADING__;
    mockNavigate.mockReset();
    mockCreateInvoice.mockReset();
    mockCreateInvoice.withOptimisticUpdate.mockReset();
    mockUseAuthenticatedQuery.mockReset();
    mockUseAuthenticatedMutation.mockReset();
    mockUseOrganization.mockReset();

    mockUseOrganization.mockReturnValue({
      billingEnabled: true,
      orgSlug: "acme",
      organizationId: ORGANIZATION_ID,
      organizationName: "Acme",
      userRole: "owner",
    });

    mockUseAuthenticatedMutation.mockReturnValue({
      canAct: true,
      isAuthLoading: false,
      mutate: mockCreateInvoice,
    });

    mockCreateInvoice.mockResolvedValue({ invoiceId: CREATED_INVOICE_ID, success: true });
    mockInvoiceQueries();
  });

  it("renders the invoice table with invoice and client metadata", () => {
    render(<InvoicesListPage />);

    expect(screen.getByTestId(TEST_IDS.INVOICES.CONTENT)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.INVOICES.TABLE)).toBeInTheDocument();
    expect(screen.getByText("INV-2026-901")).toBeInTheDocument();
    expect(screen.getByText("INV-2026-902")).toBeInTheDocument();
    expect(screen.getByText("Northstar Labs")).toBeInTheDocument();
    expect(screen.getByText("$2,400.00")).toBeInTheDocument();
  });

  it("returns the correct empty-state config for filtered and unfiltered views", () => {
    const onClearFilter = vi.fn();
    const onCreateDraft = vi.fn();

    const defaultConfig = getInvoiceEmptyStateConfig({
      onClearFilter,
      onCreateDraft,
      status: "all",
    });
    const filteredConfig = getInvoiceEmptyStateConfig({
      onClearFilter,
      onCreateDraft,
      status: "overdue",
    });

    expect(defaultConfig).toMatchObject({
      description: "Create a draft invoice to get started with billing.",
      testId: TEST_IDS.INVOICES.EMPTY_STATE,
      title: "No invoices yet",
    });
    expect(defaultConfig.action.label).toBe("New draft");

    expect(filteredConfig).toMatchObject({
      description: 'No invoices match the "overdue" filter.',
      testId: TEST_IDS.INVOICES.FILTERED_EMPTY_STATE,
      title: "No overdue invoices",
    });
    expect(filteredConfig.action.label).toBe("Clear filter");
  });

  it("opens the create dialog and navigates to the new draft after creation", async () => {
    const user = userEvent.setup();

    render(<InvoicesListPage />);

    await user.click(screen.getByRole("button", { name: "New draft" }));

    expect(await screen.findByTestId(TEST_IDS.INVOICES.CREATE_DIALOG)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create Draft" }));

    await waitFor(() => {
      expect(mockCreateInvoice).toHaveBeenCalledWith({
        clientId: undefined,
        dueDate: expect.any(Number),
        issueDate: expect.any(Number),
        lineItems: [{ description: "Services rendered", quantity: 1, rate: 0 }],
        organizationId: ORGANIZATION_ID,
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        params: { invoiceId: CREATED_INVOICE_ID, orgSlug: "acme" },
        to: ROUTES.invoices.detail.path,
      });
    });
  });

  it("renders the route-owned loading shell when the e2e loading override is enabled", () => {
    window.__NIXELO_E2E_INVOICES_LOADING__ = true;

    render(<InvoicesListPage />);

    expect(screen.getByTestId(TEST_IDS.INVOICES.LOADING_STATE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New draft" })).toBeDisabled();
    expect(screen.getAllByTestId(TEST_IDS.LOADING.SKELETON).length).toBeGreaterThan(0);
    expect(screen.queryByTestId(TEST_IDS.INVOICES.TABLE)).not.toBeInTheDocument();
  });
});
