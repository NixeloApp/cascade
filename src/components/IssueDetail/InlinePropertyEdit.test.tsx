import type { Id } from "@convex/_generated/dataModel";
import { DAY } from "@convex/lib/timeUtils";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@/test/custom-render";
import {
  InlineAssigneeSelect,
  InlinePrioritySelect,
  InlineStatusSelect,
  InlineStoryPointsInput,
  InlineTypeSelect,
  PropertyRow,
} from "./InlinePropertyEdit";

vi.mock("@/components/ui/Select", async () => await import("@/test/__tests__/selectMock"));

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
        <InlineTypeSelect value={"task" as IssueTypeWithSubtask} onChange={onTypeChange} />
      </>,
    );

    expect(screen.getByLabelText("Change priority")).toHaveValue("medium");
    expect(screen.getByLabelText("Change type")).toHaveValue("task");

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
          startsAt: Date.now() + DAY,
          endsAt: Date.now() + 3 * DAY,
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

    const alexOption = screen.getByRole("button", { name: /Alex/i });
    expect(within(alexOption).getByText("OOO")).toBeInTheDocument();
    await user.click(alexOption);
    expect(onAssigneeChange).toHaveBeenCalledWith("user_1");

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
