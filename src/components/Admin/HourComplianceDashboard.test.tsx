import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { act, fireEvent, render, screen } from "@/test/custom-render";
import { HourComplianceDashboard } from "./HourComplianceDashboard";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/ui/Badge", () => ({
  Badge: ({
    children,
  }: {
    children: ReactNode;
    variant?: string;
    size?: string;
    className?: string;
  }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Icon", () => ({
  Icon: ({ icon }: { icon: LucideIcon; size?: string; className?: string }) => (
    <span>{icon.displayName ?? "icon"}</span>
  ),
}));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
    gap?: string;
    align?: string;
  }) => <div className={className}>{children}</div>,
}));

vi.mock("@/components/ui/Typography", () => ({
  Typography: ({
    children,
    as,
    className,
  }: {
    children: ReactNode;
    as?: "span";
    className?: string;
    variant?: string;
    color?: string;
  }) => {
    const Component = as ?? "div";
    return <Component className={className}>{children}</Component>;
  },
}));

vi.mock("../ui/Button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type = "button",
    form,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit";
    form?: string;
    variant?: string;
    size?: string;
    isLoading?: boolean;
  }) => (
    <button disabled={disabled} form={form} onClick={onClick} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/Card", () => ({
  Card: ({
    children,
  }: {
    children: ReactNode;
    padding?: string;
    hoverable?: boolean;
    variant?: string;
  }) => <div>{children}</div>,
  CardHeader: ({
    title,
    description,
    action,
  }: {
    title: string;
    description?: string;
    action?: ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      {action}
    </div>
  ),
  CardBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel: string;
    variant?: string;
  }) =>
    isOpen ? (
      <div>
        <div>{title}</div>
        <div>{message}</div>
        <button onClick={onConfirm} type="button">
          {confirmLabel}
        </button>
        <button onClick={onClose} type="button">
          Close Confirm
        </button>
      </div>
    ) : null,
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({
    open,
    children,
    footer,
    title,
  }: {
    open: boolean;
    children: ReactNode;
    footer?: ReactNode;
    title: string;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div>
        <div>{title}</div>
        {children}
        {footer}
      </div>
    ) : null,
}));

vi.mock("../ui/EmptyState", () => ({
  EmptyState: ({
    title,
    description,
    action,
  }: {
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
    icon?: LucideIcon;
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      {action ? (
        <button onClick={action.onClick} type="button">
          {action.label}
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
    direction?: string;
    gap?: string;
    justify?: string;
    align?: string;
  }) => <div className={className}>{children}</div>,
  FlexItem: ({ children }: { children: ReactNode; flex?: string; className?: string }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../ui/form", () => ({
  Input: ({
    label,
    value,
    onChange,
    type,
  }: {
    label: string;
    value: string;
    onChange: (event: { target: { value: string } }) => void;
    type?: string;
  }) => (
    <label>
      <span>{label}</span>
      <input
        aria-label={label}
        onChange={(event) => onChange({ target: { value: event.target.value } })}
        type={type}
        value={value}
      />
    </label>
  ),
  Select: ({
    label,
    value,
    onChange,
    children,
  }: {
    label: string;
    value: string;
    onChange: (event: { target: { value: string } }) => void;
    children: ReactNode;
  }) => (
    <label>
      <span>{label}</span>
      <select
        aria-label={label}
        onChange={(event) => onChange({ target: { value: event.target.value } })}
        value={value}
      >
        {children}
      </select>
    </label>
  ),
  Textarea: ({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (event: { target: { value: string } }) => void;
    placeholder?: string;
    rows?: number;
  }) => (
    <label>
      <span>{label}</span>
      <textarea
        aria-label={label}
        onChange={(event) => onChange({ target: { value: event.target.value } })}
        placeholder={placeholder}
        value={value}
      />
    </label>
  ),
}));

vi.mock("../ui/Grid", () => ({
  Grid: ({ children }: { children: ReactNode; cols?: number; colsMd?: number; gap?: string }) => (
    <div>{children}</div>
  ),
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

const reviewRecord = vi.fn();
const checkAllCompliance = vi.fn();

type Procedure = (...args: unknown[]) => Promise<void>;

function createMutationMock(
  procedure: typeof reviewRecord | typeof checkAllCompliance,
): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign((...args: Parameters<Procedure>) => procedure(...args), {
    withOptimisticUpdate: () => mutation,
  }) as ReactMutation<FunctionReference<"mutation">>;
  return mutation;
}

let summaryData:
  | {
      complianceRate: number;
      compliant: number;
      underHours: number;
      overHours: number;
      equityUnder: number;
    }
  | undefined;

let recordsData:
  | Array<{
      _id: Id<"hourComplianceRecords">;
      status: "compliant" | "under_hours" | "over_hours" | "equity_under";
      periodType: "week" | "month";
      periodStart: number;
      periodEnd: number;
      totalHoursWorked: number;
      hoursDeficit?: number;
      hoursExcess?: number;
      equityHoursDeficit?: number;
      totalEquityHours?: number;
      reviewNotes?: string;
      reviewedBy?: Id<"users">;
      user?: {
        name?: string;
        email?: string;
      };
    }>
  | undefined;

function getExpectedCurrentWeekRange() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return {
    periodType: "week" as const,
    periodStart: weekStart.getTime(),
    periodEnd: weekEnd.getTime(),
  };
}

describe("HourComplianceDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-14T12:00:00.000Z"));

    summaryData = {
      complianceRate: 87.5,
      compliant: 7,
      underHours: 2,
      overHours: 1,
      equityUnder: 1,
    };
    recordsData = [];

    mockUseAuthenticatedQuery.mockImplementation(() => {
      const callPosition = mockUseAuthenticatedQuery.mock.calls.length % 2;
      return callPosition === 1 ? summaryData : recordsData;
    });

    mockUseAuthenticatedMutation.mockImplementation(() => {
      const callPosition = mockUseAuthenticatedMutation.mock.calls.length % 2;
      return callPosition === 1
        ? { mutate: createMutationMock(reviewRecord), canAct: true, isAuthLoading: false }
        : { mutate: createMutationMock(checkAllCompliance), canAct: true, isAuthLoading: false };
    });

    reviewRecord.mockResolvedValue(undefined);
    checkAllCompliance.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders summary stats, empty-state records, and forwards filter args to the queries", async () => {
    render(<HourComplianceDashboard />);

    expect(screen.getByText("87.5%")).toBeInTheDocument();
    expect(screen.getAllByText("Compliant").length).toBeGreaterThan(0);
    expect(screen.getByText("No compliance records")).toBeInTheDocument();
    expect(mockUseAuthenticatedQuery).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(mockUseAuthenticatedQuery).toHaveBeenNthCalledWith(2, expect.anything(), {
      status: undefined,
      startDate: undefined,
      endDate: undefined,
      limit: 100,
    });

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "under_hours" } });
    fireEvent.change(screen.getByLabelText("Start Date"), { target: { value: "2026-03-01" } });
    fireEvent.change(screen.getByLabelText("End Date"), { target: { value: "2026-03-14" } });

    expect(mockUseAuthenticatedQuery).toHaveBeenLastCalledWith(expect.anything(), {
      status: "under_hours",
      startDate: new Date("2026-03-01").getTime(),
      endDate: new Date("2026-03-14").getTime(),
      limit: 100,
    });
  });

  it("opens the review dialog and submits review notes successfully", async () => {
    recordsData = [
      {
        _id: "record_1" as Id<"hourComplianceRecords">,
        status: "under_hours",
        periodType: "week",
        periodStart: new Date("2026-03-01").getTime(),
        periodEnd: new Date("2026-03-08").getTime(),
        totalHoursWorked: 32,
        hoursDeficit: 8,
        user: { name: "Taylor Rivera", email: "taylor@example.com" },
      },
    ];

    render(<HourComplianceDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "Review" }));

    expect(screen.getByText("Review Compliance Record")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Review Notes (Optional)"), {
      target: { value: "Discussed expected weekly load." },
    });

    await act(async () => {
      fireEvent.submit(document.getElementById("review-form") as HTMLFormElement);
    });

    expect(reviewRecord).toHaveBeenCalledWith({
      recordId: "record_1",
      notes: "Discussed expected weekly load.",
    });
    expect(mockShowSuccess).toHaveBeenCalledWith("Compliance record reviewed");
  });

  it("confirms the weekly compliance check for all users", async () => {
    render(<HourComplianceDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "Check All Users (This Week)" }));
    expect(screen.getByText("Check Compliance")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Check All" }));
    });

    expect(checkAllCompliance).toHaveBeenCalledWith(getExpectedCurrentWeekRange());
    expect(mockShowSuccess).toHaveBeenCalledWith("Compliance check initiated for all users");
    expect(mockShowError).not.toHaveBeenCalled();
  });
});
