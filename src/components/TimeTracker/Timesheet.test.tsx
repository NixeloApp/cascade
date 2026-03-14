import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { Timesheet } from "./Timesheet";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/lib/icons", () => ({
  Calendar: () => <span data-testid="calendar-icon" />,
  DollarSign: () => <span data-testid="dollar-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    title,
    message,
    confirmLabel,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onClose: () => void;
    onConfirm: () => void;
  }) =>
    isOpen ? (
      <div>
        <div>{title}</div>
        <div>{message}</div>
        <button type="button" onClick={onConfirm}>
          {confirmLabel ?? "Confirm"}
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    ) : null,
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Grid", () => ({
  Grid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Icon", () => ({
  Icon: () => <span data-testid="timesheet-icon" />,
}));

vi.mock("../ui/IconButton", () => ({
  IconButton: ({
    children,
    onClick,
    "aria-label": ariaLabel,
  }: {
    children: ReactNode;
    onClick?: () => void;
    "aria-label"?: string;
  }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/LoadingSpinner", () => ({
  LoadingSpinner: () => <div>loading-spinner</div>,
}));

vi.mock("../ui/Progress", () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="timesheet-progress">{value}</div>,
}));

vi.mock("../ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

type MutationProcedure = (
  ...args: Parameters<ReturnType<typeof useAuthenticatedMutation>["mutate"]>
) => ReturnType<ReturnType<typeof useAuthenticatedMutation>["mutate"]>;

function createMutationMock(
  mockProcedure: Mock<MutationProcedure>,
): ReactMutation<FunctionReference<"mutation">> {
  const mutation = ((...args: Parameters<typeof mockProcedure>) =>
    mockProcedure(...args)) as ReactMutation<FunctionReference<"mutation">>;
  mutation.withOptimisticUpdate = () => mutation;
  return mutation;
}

const deleteTimeEntry = vi.fn<MutationProcedure>();
const entryId = "entry_1" as Id<"timeEntries">;
const startDate = Date.UTC(2026, 2, 9, 12);

let currentTimesheet:
  | {
      startDate: number;
      totalHours: number;
      billableHours: number;
      byDay: Record<
        string,
        Array<{
          _id: Id<"timeEntries">;
          projectKey: string;
          issueKey: string;
          description?: string;
          billable?: boolean;
          hourlyRate?: number;
          hours: number;
        }>
      >;
    }
  | undefined;

describe("Timesheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteTimeEntry.mockResolvedValue(undefined);
    currentTimesheet = undefined;

    mockUseAuthenticatedQuery.mockImplementation(() => currentTimesheet);
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createMutationMock(deleteTimeEntry),
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("renders the loading state while the current week timesheet is unavailable", () => {
    render(<Timesheet />);

    expect(screen.getByText("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText("My Timesheet")).not.toBeInTheDocument();
  });

  it("renders the empty-week state with zero totals", () => {
    currentTimesheet = {
      startDate,
      totalHours: 0,
      billableHours: 0,
      byDay: {},
    };

    render(<Timesheet />);

    expect(screen.getByText("My Timesheet")).toBeInTheDocument();
    expect(screen.getByText("Week of Mon, Mar 9")).toBeInTheDocument();
    expect(screen.getAllByText("0.00")).toHaveLength(2);
    expect(screen.getByText("0.00 / 40 hours (full-time week)")).toBeInTheDocument();
    expect(screen.getByTestId("timesheet-progress")).toHaveTextContent("0");
    expect(
      screen.getByText("No time entries this week. Start a timer to begin tracking!"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Revenue")).not.toBeInTheDocument();
  });

  it("renders populated entries and deletes an entry through the confirm dialog", async () => {
    currentTimesheet = {
      startDate,
      totalHours: 10,
      billableHours: 8,
      byDay: {
        "2026-03-09": [
          {
            _id: entryId,
            projectKey: "CORE",
            issueKey: "CORE-12",
            description: "Implement billing export",
            billable: true,
            hourlyRate: 150,
            hours: 2.5,
          },
        ],
        "2026-03-11": [
          {
            _id: "entry_2" as Id<"timeEntries">,
            projectKey: "PORTAL",
            issueKey: "PORTAL-3",
            hours: 7.5,
          },
        ],
      },
    };

    render(<Timesheet />);

    expect(screen.getByText("10.00")).toBeInTheDocument();
    expect(screen.getByText("8.00")).toBeInTheDocument();
    expect(screen.getByText("$375.00")).toBeInTheDocument();
    expect(screen.getByTestId("timesheet-progress")).toHaveTextContent("25");
    expect(screen.getAllByText("2.50h")).toHaveLength(2);
    expect(screen.getAllByText("7.50h")).toHaveLength(2);
    expect(screen.getByText("Implement billing export")).toBeInTheDocument();
    expect(screen.getByText("CORE")).toBeInTheDocument();
    expect(screen.getByText("CORE-12")).toBeInTheDocument();
    expect(screen.getByText("PORTAL")).toBeInTheDocument();
    expect(screen.getByText("PORTAL-3")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Delete entry" })[0]);

    expect(screen.getByText("Delete Time Entry")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to delete this time entry?"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteTimeEntry).toHaveBeenCalledWith({ entryId }));
    expect(mockShowSuccess).toHaveBeenCalledWith("Time entry deleted");
  });

  it("surfaces delete failures through the shared error toast", async () => {
    const error = new Error("delete failed");
    deleteTimeEntry.mockRejectedValueOnce(error);
    currentTimesheet = {
      startDate,
      totalHours: 2.5,
      billableHours: 2.5,
      byDay: {
        "2026-03-09": [
          {
            _id: entryId,
            projectKey: "CORE",
            issueKey: "CORE-12",
            hours: 2.5,
          },
        ],
      },
    };

    render(<Timesheet />);

    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(error, "Failed to delete entry"),
    );
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });
});
