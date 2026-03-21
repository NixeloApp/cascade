import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { SubtasksList } from "./SubtasksList";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("../ui/Button", () => ({
  Button: ({
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

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/form/Checkbox", () => ({
  Checkbox: ({
    checked,
    "aria-label": ariaLabel,
  }: {
    checked?: boolean;
    "aria-label"?: string;
  }) => <input type="checkbox" checked={checked} aria-label={ariaLabel} readOnly />,
}));

vi.mock("../ui/form/Input", () => ({
  Input: ({
    value,
    onChange,
    onKeyDown,
    placeholder,
  }: {
    value?: string;
    onChange?: (event: { target: { value: string } }) => void;
    onKeyDown?: (event: { key: string }) => void;
    placeholder?: string;
  }) => (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange?.({ target: { value: event.target.value } })}
      onKeyDown={(event) => onKeyDown?.({ key: event.key })}
    />
  ),
}));

vi.mock("../ui/Metadata", () => ({
  Metadata: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MetadataItem: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("../ui/Progress", () => ({
  Progress: ({ value }: { value: number }) => <div>{`progress:${value}`}</div>,
}));

vi.mock("../ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
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

const createIssue = vi.fn<MutationProcedure>();

const defaultProps = {
  issueId: "issue_1" as Id<"issues">,
  projectId: "project_1" as Id<"projects">,
};

describe("SubtasksList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createIssue.mockResolvedValue(undefined);
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createMutationMock(createIssue),
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("renders progress, completion state, and assignee details for existing subtasks", () => {
    render(
      <SubtasksList
        {...defaultProps}
        subtasks={[
          {
            _id: "subtask_1" as Id<"issues">,
            key: "PROJ-2",
            title: "Draft release notes",
            status: "done",
            assignee: { name: "Alex" },
          },
          {
            _id: "subtask_2" as Id<"issues">,
            key: "PROJ-3",
            title: "Verify migration",
            status: "todo",
            assignee: { email: "morgan@example.com" },
          },
        ]}
      />,
    );

    expect(screen.getByText("Sub-tasks")).toBeInTheDocument();
    expect(screen.getByText("(1/2 completed)")).toBeInTheDocument();
    expect(screen.getByText("progress:50")).toBeInTheDocument();
    expect(screen.getByText("PROJ-2")).toBeInTheDocument();
    expect(screen.getByText("Draft release notes")).toBeInTheDocument();
    expect(screen.getByText("Assigned to Alex")).toBeInTheDocument();
    expect(screen.getByText("Assigned to morgan@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText("Mark Draft release notes as incomplete")).toBeChecked();
    expect(screen.getByLabelText("Mark Verify migration as complete")).not.toBeChecked();
  });

  it("shows the empty state and supports create, cancel, and successful submit flows", async () => {
    const user = userEvent.setup();

    render(<SubtasksList {...defaultProps} subtasks={[]} />);

    expect(screen.getByText("No subtasks yet")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ Add Sub-task" }));
    expect(screen.getByPlaceholderText("Sub-task title...")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Sub-task title..."), "Temp draft");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByPlaceholderText("Sub-task title...")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ Add Sub-task" }));
    const input = screen.getByPlaceholderText("Sub-task title...");
    await user.type(input, "  Finalized subtask  ");
    await user.click(screen.getByRole("button", { name: "Add sub-task" }));

    await waitFor(() =>
      expect(createIssue).toHaveBeenCalledWith({
        projectId: "project_1",
        title: "Finalized subtask",
        type: "subtask",
        priority: "medium",
        parentId: "issue_1",
      }),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith("Sub-task created");
    expect(screen.queryByPlaceholderText("Sub-task title...")).not.toBeInTheDocument();
  });

  it("ignores blank input, supports escape dismissal, and surfaces create errors", async () => {
    const user = userEvent.setup();
    const error = new Error("create failed");
    createIssue.mockRejectedValueOnce(error);

    render(<SubtasksList {...defaultProps} subtasks={undefined} />);

    await user.click(screen.getByRole("button", { name: "+ Add Sub-task" }));
    const input = screen.getByPlaceholderText("Sub-task title...");

    await user.type(input, "   ");
    await user.click(screen.getByRole("button", { name: "Add sub-task" }));
    expect(createIssue).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Sub-task title...")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ Add Sub-task" }));
    const retryInput = screen.getByPlaceholderText("Sub-task title...");
    await user.type(retryInput, "Broken create");
    fireEvent.keyDown(retryInput, { key: "Enter" });

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(error, "Failed to create sub-task"),
    );
    expect(screen.getByPlaceholderText("Sub-task title...")).toHaveValue("Broken create");
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });
});
