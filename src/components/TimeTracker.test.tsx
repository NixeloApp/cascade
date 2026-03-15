import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { TimeTracker } from "./TimeTracker";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  getCardRecipeClassName: (recipe: string) => `recipe-${recipe}`,
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Icon", () => ({
  Icon: () => <span data-testid="time-tracker-icon" />,
}));

vi.mock("@/components/ui/Metadata", () => ({
  MetadataTimestamp: ({ date }: { date: number }) => <span>{`date:${date}`}</span>,
}));

vi.mock("@/components/ui/Progress", () => ({
  Progress: ({ value, variant }: { value: number; variant?: string }) => (
    <div data-testid="time-progress" data-value={String(value)} data-variant={variant ?? ""} />
  ),
}));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("./ui/Button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    title,
    leftIcon,
    rightIcon,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    title?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled} title={title}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  ),
}));

vi.mock("./ui/Typography", () => ({
  Typography: ({
    children,
    as: Component = "div",
  }: {
    children: ReactNode;
    as?: "div" | "span";
  }) => <Component>{children}</Component>,
}));

vi.mock("./TimeTracking/TimeEntryModal", () => ({
  TimeEntryModal: ({
    open,
    issueId,
    projectId,
    billingEnabled,
  }: {
    open: boolean;
    issueId?: Id<"issues">;
    projectId?: Id<"projects">;
    billingEnabled?: boolean;
  }) =>
    open ? (
      <div data-testid="time-entry-modal">
        {`modal:${issueId ?? "none"}:${projectId ?? "none"}:${String(billingEnabled)}`}
      </div>
    ) : null,
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

const startTimer = vi.fn<MutationProcedure>();
const stopTimer = vi.fn<MutationProcedure>();

const issueId = "issue_1" as Id<"issues">;
const otherIssueId = "issue_2" as Id<"issues">;
const projectId = "project_1" as Id<"projects">;
const runningEntryId = "entry_running" as Id<"timeEntries">;
const entry1Id = "entry_1" as Id<"timeEntries">;
const entry2Id = "entry_2" as Id<"timeEntries">;

let currentEntries: Array<{
  _id: Id<"timeEntries">;
  duration: number;
  date: number;
  description?: string;
  activity?: string;
  billable?: boolean;
  totalCost?: number;
}>;
let currentRunningTimer:
  | {
      _id: Id<"timeEntries">;
      issueId: Id<"issues">;
    }
  | null
  | undefined;

describe("TimeTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentEntries = [];
    currentRunningTimer = null;
    startTimer.mockResolvedValue(undefined);
    stopTimer.mockResolvedValue({ duration: 5400 });

    mockUseAuthenticatedQuery.mockImplementation((_query, args) => {
      if (typeof args === "object" && args && "limit" in args) {
        return currentEntries;
      }
      return currentRunningTimer;
    });

    let mutationCallCount = 0;
    mockUseAuthenticatedMutation.mockImplementation(() => {
      mutationCallCount += 1;
      return mutationCallCount % 2 === 1
        ? {
            mutate: createMutationMock(startTimer),
            canAct: true,
            isAuthLoading: false,
          }
        : {
            mutate: createMutationMock(stopTimer),
            canAct: true,
            isAuthLoading: false,
          };
    });
  });

  it("renders the empty state, starts a timer, and opens the log-time modal", async () => {
    const user = userEvent.setup();

    render(
      <TimeTracker
        issueId={issueId}
        projectId={projectId}
        estimatedHours={0}
        billingEnabled={true}
      />,
    );

    expect(screen.getByText("Time Tracking")).toBeInTheDocument();
    expect(screen.getByText("No time logged yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Timer" })).toBeEnabled();
    expect(screen.queryByTestId("time-entry-modal")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start Timer" }));

    await waitFor(() =>
      expect(startTimer).toHaveBeenCalledWith({
        projectId,
        issueId,
        billable: false,
      }),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith("Timer started");

    await user.click(screen.getByRole("button", { name: "Log Time" }));

    expect(screen.getByTestId("time-entry-modal")).toHaveTextContent(
      `modal:${issueId}:${projectId}:true`,
    );
  });

  it("stops the running timer for this issue and reports logged hours", async () => {
    const user = userEvent.setup();
    currentRunningTimer = {
      _id: runningEntryId,
      issueId,
    };

    render(<TimeTracker issueId={issueId} projectId={projectId} estimatedHours={1} />);

    expect(screen.getByRole("button", { name: "Stop Timer" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Stop Timer" }));

    await waitFor(() => expect(stopTimer).toHaveBeenCalledWith({ entryId: runningEntryId }));
    expect(mockShowSuccess).toHaveBeenCalledWith("Timer stopped: 1.50h logged");
  });

  it("renders over-estimate progress, disables start when another issue is running, and expands time entries", async () => {
    const user = userEvent.setup();
    currentRunningTimer = {
      _id: runningEntryId,
      issueId: otherIssueId,
    };
    currentEntries = [
      {
        _id: entry1Id,
        duration: 7200,
        date: 1_710_000_000_000,
        description: "Discovery workshop",
        activity: "Meeting",
        billable: true,
        totalCost: 150,
      },
      {
        _id: entry2Id,
        duration: 3600,
        date: 1_710_086_400_000,
        description: "Implementation",
      },
    ];

    render(
      <TimeTracker
        issueId={issueId}
        projectId={projectId}
        estimatedHours={2}
        billingEnabled={true}
      />,
    );

    expect(
      screen.getByText((_, element) => element?.textContent === "3.0h / 2h estimated"),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === "+1.0h over"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("time-progress")).toHaveAttribute("data-value", "100");
    expect(screen.getByTestId("time-progress")).toHaveAttribute("data-variant", "error");
    expect(screen.getByRole("button", { name: "Start Timer" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "View Time Entries (2)" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View Time Entries (2)" }));

    expect(screen.getByText("Discovery workshop")).toBeInTheDocument();
    expect(screen.getByText("Implementation")).toBeInTheDocument();
    expect(screen.getByText("Meeting")).toBeInTheDocument();
    expect(screen.getByText("Billable")).toBeInTheDocument();
    expect(screen.getByText("$150.00")).toBeInTheDocument();
    expect(screen.getByText("date:1710000000000")).toBeInTheDocument();
    expect(screen.getByText("date:1710086400000")).toBeInTheDocument();
  });

  it("surfaces timer action failures through the shared error toast", async () => {
    const user = userEvent.setup();
    const error = new Error("timer failed");
    startTimer.mockRejectedValueOnce(error);

    render(<TimeTracker issueId={issueId} projectId={projectId} />);

    await user.click(screen.getByRole("button", { name: "Start Timer" }));

    await waitFor(() => expect(mockShowError).toHaveBeenCalledWith(error, "Failed to start timer"));
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });
});
