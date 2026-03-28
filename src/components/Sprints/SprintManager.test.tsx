import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { DAY } from "@convex/lib/timeUtils";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { createContext, type ReactNode, useContext } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor, within } from "@/test/custom-render";
import { SprintManager } from "./SprintManager";

interface SelectContextValue {
  onValueChange?: (value: string) => void;
}

interface RadioGroupContextValue {
  onValueChange?: (value: string) => void;
}

interface SelectProps {
  children: ReactNode;
  onValueChange?: (value: string) => void;
}

interface SelectItemProps {
  children: ReactNode;
  value: string;
}

interface RadioGroupProps {
  children: ReactNode;
  onValueChange?: (value: string) => void;
}

interface RadioGroupItemProps {
  value: string;
  label?: string;
  description?: string;
  disabled?: boolean;
}

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    sprints: {
      listByProject: "sprints.listByProject",
      getIncompleteIssueIds: "sprints.getIncompleteIssueIds",
      create: "sprints.create",
      startSprint: "sprints.startSprint",
      completeSprint: "sprints.completeSprint",
    },
    issues: {
      bulkMoveToSprint: "issues.bulkMoveToSprint",
    },
  },
}));

const selectContext = createContext<SelectContextValue>({});
const radioGroupContext = createContext<RadioGroupContextValue>({});

vi.mock("../ui/Select", () => ({
  Select: ({ children, onValueChange }: SelectProps) => (
    <selectContext.Provider value={{ onValueChange }}>{children}</selectContext.Provider>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: SelectItemProps) => {
    const { onValueChange } = useContext(selectContext);
    return (
      <button type="button" onClick={() => onValueChange?.(value)}>
        {children}
      </button>
    );
  },
}));

vi.mock("../ui/RadioGroup", () => ({
  RadioGroup: ({ children, onValueChange }: RadioGroupProps) => (
    <radioGroupContext.Provider value={{ onValueChange }}>{children}</radioGroupContext.Provider>
  ),
  RadioGroupItem: ({ value, label, description, disabled = false }: RadioGroupItemProps) => {
    const { onValueChange } = useContext(radioGroupContext);
    return (
      <button type="button" disabled={disabled} onClick={() => onValueChange?.(value)}>
        <span>{label}</span>
        {description ? <span>{description}</span> : null}
      </button>
    );
  },
}));

vi.mock("../Analytics/SprintBurnChart", () => ({
  SprintBurnChart: ({ sprintId }: { sprintId: string }) => <div>{`Burn chart ${sprintId}`}</div>,
}));

vi.mock("../ui/Skeleton", () => ({
  SkeletonProjectCard: () => <div>Loading sprint card</div>,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

const mockCreateSprint = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockStartSprint = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockCompleteSprint = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockBulkMoveToSprint = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

const projectId = "project_1" as Id<"projects">;
const activeSprintId = "sprint_active" as Id<"sprints">;
const futureSprintId = "sprint_future" as Id<"sprints">;

function toTimestamp(date: string): number {
  return new Date(date).getTime();
}

function createSprint(
  overrides: Partial<Doc<"sprints"> & { issueCount: number; completedCount: number }> = {},
) {
  return {
    _id: activeSprintId,
    _creationTime: DAY,
    projectId,
    name: "Current Sprint",
    goal: "Ship the next milestone",
    startDate: toTimestamp("2026-03-10"),
    endDate: toTimestamp("2026-03-20"),
    status: "active" as const,
    createdBy: "user_1" as Id<"users">,
    updatedAt: DAY,
    issueCount: 6,
    completedCount: 3,
    ...overrides,
  };
}

function getSprintCard(name: string): HTMLElement {
  const card = screen
    .getAllByTestId(TEST_IDS.SPRINT.CARD)
    .find(
      (candidate) =>
        within(candidate).queryByTestId(TEST_IDS.SPRINT.NAME)?.textContent?.trim() === name,
    );

  if (!card) {
    throw new Error(`Sprint card not found: ${name}`);
  }

  return card;
}

describe("SprintManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuthenticatedMutation.mockImplementation((reference) => {
      switch (reference) {
        case api.sprints.create:
          return { mutate: mockCreateSprint, canAct: true, isAuthLoading: false };
        case api.sprints.startSprint:
          return { mutate: mockStartSprint, canAct: true, isAuthLoading: false };
        case api.sprints.completeSprint:
          return { mutate: mockCompleteSprint, canAct: true, isAuthLoading: false };
        case api.issues.bulkMoveToSprint:
          return { mutate: mockBulkMoveToSprint, canAct: true, isAuthLoading: false };
        default:
          throw new Error(`Unexpected mutation reference: ${String(reference)}`);
      }
    });

    mockUseAuthenticatedQuery.mockImplementation((reference, args) => {
      if (reference === api.sprints.listByProject) {
        return [
          createSprint({ _id: activeSprintId }),
          createSprint({
            _id: futureSprintId,
            name: "Sprint 8",
            goal: "Queue next sprint work",
            startDate: undefined,
            endDate: undefined,
            status: "future",
            issueCount: 2,
            completedCount: 0,
          }),
        ];
      }

      if (reference === api.sprints.getIncompleteIssueIds) {
        if (args === "skip") {
          return undefined;
        }

        return ["issue_1" as Id<"issues">, "issue_2" as Id<"issues">];
      }

      throw new Error(`Unexpected query reference: ${String(reference)}`);
    });
  });

  it("renders loading skeletons while sprint data is unresolved", () => {
    mockUseAuthenticatedQuery.mockImplementation((reference) => {
      if (reference === api.sprints.listByProject) {
        return undefined;
      }

      return undefined;
    });

    render(<SprintManager projectId={projectId} />);

    expect(screen.getByText("Sprint Management")).toBeInTheDocument();
    expect(screen.getAllByText("Loading sprint card")).toHaveLength(3);
  });

  it("creates a sprint with custom dates and shows overlap warnings", async () => {
    const user = userEvent.setup();
    mockCreateSprint.mockResolvedValue(undefined);

    render(<SprintManager projectId={projectId} />);

    await user.click(screen.getByRole("button", { name: /Create Sprint/ }));
    await user.type(screen.getByLabelText("Sprint Name"), "Sprint 9");
    await user.type(screen.getByLabelText("Sprint Goal (Optional)"), "Finish the redesign");
    await user.click(screen.getByRole("button", { name: /Custom/i }));

    await user.type(screen.getByLabelText("Start Date"), "2026-03-12");
    await user.type(screen.getByLabelText("End Date"), "2026-03-18");

    expect(screen.getByRole("alert")).toHaveTextContent("These dates overlap with: Current Sprint");

    await user.click(screen.getByRole("button", { name: "Create Sprint" }));

    await waitFor(() =>
      expect(mockCreateSprint).toHaveBeenCalledWith({
        projectId,
        name: "Sprint 9",
        goal: "Finish the redesign",
        startDate: toTimestamp("2026-03-12"),
        endDate: toTimestamp("2026-03-18"),
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Sprint created successfully");
    expect(screen.queryByLabelText("Sprint Name")).not.toBeInTheDocument();
  });

  it("starts a future sprint with custom dates and overlap warnings", async () => {
    const user = userEvent.setup();
    mockStartSprint.mockResolvedValue(undefined);

    render(<SprintManager projectId={projectId} />);

    await user.click(within(getSprintCard("Sprint 8")).getByTestId(TEST_IDS.SPRINT.START_TRIGGER));

    const dialog = screen.getByTestId(TEST_IDS.SPRINT.START_DIALOG);
    await user.click(within(dialog).getByTestId(TEST_IDS.SPRINT.START_PRESET("custom")));
    await user.type(within(dialog).getByTestId(TEST_IDS.SPRINT.START_DATE_INPUT), "2026-03-15");
    await user.type(within(dialog).getByTestId(TEST_IDS.SPRINT.START_END_DATE_INPUT), "2026-03-25");

    expect(within(dialog).getByTestId(TEST_IDS.SPRINT.START_OVERLAP_WARNING)).toHaveTextContent(
      "These dates overlap with: Current Sprint",
    );

    await user.click(within(dialog).getByTestId(TEST_IDS.SPRINT.START_CONFIRM_BUTTON));

    await waitFor(() =>
      expect(mockStartSprint).toHaveBeenCalledWith({
        sprintId: futureSprintId,
        startDate: toTimestamp("2026-03-15"),
        endDate: toTimestamp("2026-03-25"),
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Sprint started successfully");
    expect(screen.queryByTestId(TEST_IDS.SPRINT.START_DIALOG)).not.toBeInTheDocument();
  });

  it("completes a sprint and transfers incomplete issues to another sprint", async () => {
    const user = userEvent.setup();
    mockCompleteSprint.mockResolvedValue(undefined);
    mockBulkMoveToSprint.mockResolvedValue(undefined);

    render(<SprintManager projectId={projectId} />);

    await user.click(
      within(getSprintCard("Current Sprint")).getByTestId(TEST_IDS.SPRINT.COMPLETE_TRIGGER),
    );

    const dialog = screen.getByTestId(TEST_IDS.SPRINT.COMPLETE_DIALOG);
    expect(
      within(dialog).getByText("2 issues not completed. Choose what to do with them."),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /Move to Another Sprint/ }));
    await user.click(within(dialog).getByRole("button", { name: /Sprint 8/ }));
    await user.click(within(dialog).getByLabelText("Auto-create next sprint"));
    await user.click(within(dialog).getByTestId(TEST_IDS.SPRINT.COMPLETE_CONFIRM_BUTTON));

    await waitFor(() =>
      expect(mockBulkMoveToSprint).toHaveBeenCalledWith({
        issueIds: ["issue_1", "issue_2"],
        sprintId: futureSprintId,
      }),
    );

    expect(mockCompleteSprint).toHaveBeenCalledWith({
      sprintId: activeSprintId,
      autoCreateNext: true,
    });
    expect(mockShowSuccess).toHaveBeenCalledWith("Sprint completed successfully");
    expect(mockShowError).not.toHaveBeenCalled();
  });
});
