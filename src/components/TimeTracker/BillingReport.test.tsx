import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showInfo } from "@/lib/toast";
import { render, screen } from "@/test/custom-render";
import { BillingReport } from "./BillingReport";

const SelectContext = createContext<{
  onValueChange?: (value: string) => void;
  value?: string;
}>({});

vi.mock("@/lib/toast", () => ({
  showInfo: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/icons", () => ({
  Clock: () => <span data-testid="clock-icon" />,
  DollarSign: () => <span data-testid="dollar-icon" />,
  Download: () => <span data-testid="download-icon" />,
  TrendingUp: () => <span data-testid="trend-icon" />,
  Users: () => <span data-testid="users-icon" />,
}));

vi.mock("../ui/Button", () => ({
  Button: ({
    children,
    onClick,
    leftIcon,
  }: {
    children: ReactNode;
    onClick?: () => void;
    leftIcon?: ReactNode;
  }) => (
    <button type="button" onClick={onClick}>
      {leftIcon}
      {children}
    </button>
  ),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Grid", () => ({
  Grid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/LoadingSpinner", () => ({
  LoadingSpinner: () => <div>loading-spinner</div>,
}));

vi.mock("../ui/Progress", () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="billing-progress">{value}</div>,
}));

vi.mock("../ui/Select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => {
    const context = useContext(SelectContext);
    return <span>{context.value ?? placeholder}</span>;
  },
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(SelectContext);
    return (
      <button type="button" onClick={() => context.onValueChange?.(value)}>
        {children}
      </button>
    );
  },
}));

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

const projectId = "project_1" as Id<"projects">;
const mockShowInfo = vi.mocked(showInfo);

let currentProject:
  | {
      _id: Id<"projects">;
      name: string;
      clientName?: string;
      budget?: number;
    }
  | null
  | undefined;
let currentBilling:
  | {
      totalRevenue: number;
      totalHours: number;
      billableHours: number;
      nonBillableHours: number;
      entries: number;
      byUser: Record<
        string,
        {
          hours: number;
          billableHours: number;
          cost: number;
          name: string;
          revenue: number;
          totalCost?: number;
        }
      >;
    }
  | null
  | undefined;

describe("BillingReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentProject = {
      _id: projectId,
      name: "Client Portal",
      clientName: "Acme Corp",
      budget: 10000,
    };
    currentBilling = {
      totalRevenue: 3200,
      totalHours: 50,
      billableHours: 40,
      nonBillableHours: 10,
      entries: 12,
      byUser: {
        user_1: {
          name: "Alex Rivera",
          hours: 30,
          billableHours: 24,
          cost: 1200,
          revenue: 1800,
          totalCost: 1200,
        },
        user_2: {
          name: "Sam Lee",
          hours: 20,
          billableHours: 16,
          cost: 900,
          revenue: 1400,
          totalCost: 900,
        },
      },
    };

    mockUseAuthenticatedQuery.mockImplementation((_query, args) => {
      if (typeof args === "object" && args && "id" in args) {
        return currentProject;
      }
      return currentBilling;
    });
  });

  it("renders a loading state until both project and billing data are available", () => {
    currentProject = undefined;

    render(<BillingReport projectId={projectId} />);

    expect(screen.getByText("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText("Billing Report")).not.toBeInTheDocument();
  });

  it("renders summary metrics, team breakdown, and export action", async () => {
    const user = userEvent.setup();

    render(<BillingReport projectId={projectId} />);

    expect(screen.getByText("Billing Report")).toBeInTheDocument();
    expect(screen.getByText("Client Portal • Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("$3,200.00")).toBeInTheDocument();
    expect(screen.getByText("of $10,000.00 budget (32%)")).toBeInTheDocument();
    expect(screen.getByText("40.00")).toBeInTheDocument();
    expect(screen.getByText("of 50.00 total hours")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("10.00h non-billable")).toBeInTheDocument();
    expect(screen.getAllByText("$80.00")).toHaveLength(2);
    expect(screen.getByText("Team Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("Sam Lee")).toBeInTheDocument();
    expect(screen.getByText("24.00 / 30.00 hours (80% billable)")).toBeInTheDocument();
    expect(screen.getByText("16.00 / 20.00 hours (80% billable)")).toBeInTheDocument();
    expect(screen.getByText("Time Entries")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Team Members")).toBeInTheDocument();
    expect(screen.getByText("Blended Rate")).toBeInTheDocument();
    expect(screen.getAllByTestId("billing-progress")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Export" }));

    expect(mockShowInfo).toHaveBeenCalledWith("Export functionality coming soon");
  });

  it("switches date ranges and renders the empty team state when there are no time entries", async () => {
    const user = userEvent.setup();
    currentBilling = {
      totalRevenue: 0,
      totalHours: 0,
      billableHours: 0,
      nonBillableHours: 0,
      entries: 0,
      byUser: {},
    };

    render(<BillingReport projectId={projectId} />);

    expect(screen.getByText("No time entries recorded yet")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Last 7 days" }));

    expect(mockUseAuthenticatedQuery).toHaveBeenLastCalledWith(expect.anything(), {
      projectId,
      startDate: expect.any(Number),
      endDate: expect.any(Number),
    });
  });
});
