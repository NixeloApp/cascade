import type { Id } from "@convex/_generated/dataModel";
import type { LabelInfo } from "@convex/lib/issueHelpers";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { IssueMetadataSection } from "./IssueMetadataSection";

vi.mock("../ui/Badge", () => ({
  Badge: ({ children, style }: { children: ReactNode; style?: { backgroundColor?: string } }) => (
    <div>{`${children}:${style?.backgroundColor ?? ""}`}</div>
  ),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./InlinePropertyEdit", () => ({
  PropertyRow: ({ label, children }: { label: string; children: ReactNode }) => (
    <div>
      <div>{label}</div>
      <div>{children}</div>
    </div>
  ),
  InlineStatusSelect: ({
    value,
    workflowStates,
    onChange,
  }: {
    value: string;
    workflowStates: Array<{ id: string; name: string; category: string }>;
    onChange: (value: string) => void;
  }) => (
    <button type="button" onClick={() => onChange("done")}>
      {`status-select:${value}:${workflowStates.length}`}
    </button>
  ),
  InlineTypeSelect: ({
    value,
    onChange,
  }: {
    value: IssueTypeWithSubtask;
    onChange: (value: IssueTypeWithSubtask) => void;
  }) => (
    <button type="button" onClick={() => onChange("task")}>
      {`type-select:${value}`}
    </button>
  ),
  InlinePrioritySelect: ({
    value,
    onChange,
  }: {
    value: IssuePriority;
    onChange: (value: IssuePriority) => void;
  }) => (
    <button type="button" onClick={() => onChange("low")}>
      {`priority-select:${value}`}
    </button>
  ),
  InlineAssigneeSelect: ({
    value,
    members,
    onChange,
  }: {
    value: Id<"users"> | null | undefined;
    members: Array<{ _id: Id<"users">; name: string }>;
    onChange: (value: Id<"users"> | null) => void;
  }) => (
    <button type="button" onClick={() => onChange(members[1]?._id ?? null)}>
      {`assignee-select:${value ?? "unassigned"}:${members.length}`}
    </button>
  ),
  InlineStoryPointsInput: ({
    value,
    onChange,
  }: {
    value: number | null | undefined;
    onChange: (value: number | null) => void;
  }) => (
    <button type="button" onClick={() => onChange(13)}>
      {`story-points-input:${value ?? "unset"}`}
    </button>
  ),
}));

const members = [
  { _id: "user_1" as Id<"users">, name: "Alex" },
  { _id: "user_2" as Id<"users">, name: "Morgan" },
];

const workflowStates = [
  { id: "todo", name: "To Do", category: "backlog" },
  { id: "done", name: "Done", category: "completed" },
];

const labels: LabelInfo[] = [
  { name: "backend", color: "#123456" },
  { name: "urgent", color: "#ff0000" },
];

describe("IssueMetadataSection", () => {
  it("renders read-only metadata with fallback values and no labels section when empty", () => {
    render(
      <IssueMetadataSection
        status="todo"
        type="bug"
        priority="high"
        assignee={null}
        reporter={null}
        storyPoints={null}
        labels={[]}
        workflowStates={workflowStates}
      />,
    );

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("bug")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByText("Not set")).toBeInTheDocument();
    expect(screen.queryByText("Labels")).not.toBeInTheDocument();
    expect(screen.queryByText(/^status-select:/)).not.toBeInTheDocument();
  });

  it("renders editable controls and wires all property callbacks when edit prerequisites are met", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    const onTypeChange = vi.fn();
    const onPriorityChange = vi.fn();
    const onAssigneeChange = vi.fn();
    const onStoryPointsChange = vi.fn();

    render(
      <IssueMetadataSection
        status="todo"
        type="bug"
        priority="high"
        assignee={{ _id: "user_1" as Id<"users">, name: "Alex" }}
        reporter={{ name: "Taylor" }}
        storyPoints={8}
        labels={labels}
        editable
        members={members}
        workflowStates={workflowStates}
        onStatusChange={onStatusChange}
        onTypeChange={onTypeChange}
        onPriorityChange={onPriorityChange}
        onAssigneeChange={onAssigneeChange}
        onStoryPointsChange={onStoryPointsChange}
      />,
    );

    expect(screen.getByText("status-select:todo:2")).toBeInTheDocument();
    expect(screen.getByText("type-select:bug")).toBeInTheDocument();
    expect(screen.getByText("priority-select:high")).toBeInTheDocument();
    expect(screen.getByText("assignee-select:user_1:2")).toBeInTheDocument();
    expect(screen.getByText("story-points-input:8")).toBeInTheDocument();
    expect(screen.getByText("Taylor")).toBeInTheDocument();
    expect(screen.getByText("Labels")).toBeInTheDocument();
    expect(screen.getByText("backend:#123456")).toBeInTheDocument();
    expect(screen.getByText("urgent:#ff0000")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "status-select:todo:2" }));
    await user.click(screen.getByRole("button", { name: "type-select:bug" }));
    await user.click(screen.getByRole("button", { name: "priority-select:high" }));
    await user.click(screen.getByRole("button", { name: "assignee-select:user_1:2" }));
    await user.click(screen.getByRole("button", { name: "story-points-input:8" }));

    expect(onStatusChange).toHaveBeenCalledWith("done");
    expect(onTypeChange).toHaveBeenCalledWith("task");
    expect(onPriorityChange).toHaveBeenCalledWith("low");
    expect(onAssigneeChange).toHaveBeenCalledWith("user_2");
    expect(onStoryPointsChange).toHaveBeenCalledWith(13);
  });

  it("keeps status and assignee read-only when workflow states or members are unavailable", () => {
    render(
      <IssueMetadataSection
        status="todo"
        type="story"
        priority="medium"
        assignee={{ _id: "user_1" as Id<"users">, name: "Alex" }}
        reporter={{ name: "Taylor" }}
        storyPoints={3}
        labels={[]}
        editable
        members={[]}
        workflowStates={[]}
        onStatusChange={vi.fn()}
        onTypeChange={vi.fn()}
        onPriorityChange={vi.fn()}
        onAssigneeChange={vi.fn()}
        onStoryPointsChange={vi.fn()}
      />,
    );

    expect(screen.getByText("todo")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.queryByText(/^status-select:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^assignee-select:/)).not.toBeInTheDocument();
    expect(screen.getByText("type-select:story")).toBeInTheDocument();
    expect(screen.getByText("priority-select:medium")).toBeInTheDocument();
    expect(screen.getByText("story-points-input:3")).toBeInTheDocument();
  });
});
