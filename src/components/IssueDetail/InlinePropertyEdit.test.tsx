import type { Id } from "@convex/_generated/dataModel";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/custom-render";
import {
  InlineAssigneeSelect,
  InlinePrioritySelect,
  InlineStatusSelect,
  InlineStoryPointsInput,
  InlineTypeSelect,
  PropertyRow,
} from "./InlinePropertyEdit";

const SelectContext = createContext<{
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  value?: string;
}>({});

vi.mock("@/components/ui/Select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
  }) => (
    <SelectContext.Provider value={{ disabled, onValueChange, value }}>
      <div>{children}</div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({
    children,
    "aria-label": ariaLabel,
  }: {
    children: ReactNode;
    "aria-label"?: string;
  }) => (
    <button type="button" aria-label={ariaLabel}>
      {children}
    </button>
  ),
  SelectValue: ({ children }: { children?: ReactNode }) => {
    const context = useContext(SelectContext);
    return <span>{children ?? context.value}</span>;
  },
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(SelectContext);
    return (
      <button
        type="button"
        onClick={() => context.onValueChange?.(value)}
        disabled={context.disabled}
      >
        {children}
      </button>
    );
  },
}));

vi.mock("@/components/ui/Icon", () => ({
  Icon: () => <span data-testid="inline-icon" />,
}));

describe("InlinePropertyEdit", () => {
  it("changes priority and type selections through inline options", async () => {
    const user = userEvent.setup();
    const onPriorityChange = vi.fn();
    const onTypeChange = vi.fn();

    render(
      <>
        <InlinePrioritySelect value={"medium" as IssuePriority} onChange={onPriorityChange} />
        <InlineTypeSelect value={"feature" as IssueTypeWithSubtask} onChange={onTypeChange} />
      </>,
    );

    expect(screen.getByLabelText("Change priority")).toHaveTextContent("medium");
    expect(screen.getByLabelText("Change type")).toHaveTextContent("feature");

    await user.click(screen.getByRole("button", { name: "high" }));
    expect(onPriorityChange).toHaveBeenCalledWith("high");

    await user.click(screen.getByRole("button", { name: "Bug" }));
    expect(onTypeChange).toHaveBeenCalledWith("bug");
  });

  it("renders assignee and status state and maps selection changes correctly", async () => {
    const user = userEvent.setup();
    const onAssigneeChange = vi.fn();
    const onStatusChange = vi.fn();
    const members = [
      {
        _id: "user_1" as Id<"users">,
        name: "Alex",
        outOfOffice: {
          startsAt: new Date("2026-03-20T00:00:00Z").getTime(),
          endsAt: new Date("2026-03-22T23:59:59Z").getTime(),
          reason: "vacation" as const,
          updatedAt: Date.now(),
        },
      },
      { _id: "user_2" as Id<"users">, name: "Morgan" },
    ];
    const workflowStates = [
      { id: "todo", name: "To Do", category: "backlog" },
      { id: "in_progress", name: "In Progress", category: "active" },
    ];

    render(
      <>
        <InlineAssigneeSelect value={null} members={members} onChange={onAssigneeChange} />
        <InlineStatusSelect
          value="in_progress"
          workflowStates={workflowStates}
          onChange={onStatusChange}
        />
      </>,
    );

    expect(screen.getByLabelText("Change assignee")).toHaveTextContent("Unassigned");
    expect(screen.getByLabelText("Change status")).toHaveTextContent("In Progress");

    await user.click(screen.getByRole("button", { name: /Alex/i }));
    expect(onAssigneeChange).toHaveBeenCalledWith("user_1");
    expect(screen.getByText("OOO")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Unassigned" }));
    expect(onAssigneeChange).toHaveBeenCalledWith(null);

    await user.click(screen.getByRole("button", { name: "To Do" }));
    expect(onStatusChange).toHaveBeenCalledWith("todo");
  });

  it("parses story points input and ignores invalid numeric changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<InlineStoryPointsInput value={3} onChange={onChange} />);

    const input = screen.getByLabelText("Story points");

    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(null);

    fireEvent.change(input, { target: { value: "2.5" } });
    expect(onChange).toHaveBeenLastCalledWith(2.5);

    onChange.mockClear();
    fireEvent.change(input, { target: { value: "-1" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders property rows with their label and content", () => {
    render(
      <PropertyRow label="Priority">
        <span>High</span>
      </PropertyRow>,
    );

    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
