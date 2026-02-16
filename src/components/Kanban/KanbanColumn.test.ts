import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it, vi } from "vitest";
import {
  areKanbanIssueItemPropsEqual,
  arePropsEqual,
  type KanbanColumnProps,
} from "./KanbanColumn";

// Mock types
type Issue = KanbanColumnProps["issues"][0];

describe("KanbanColumn arePropsEqual", () => {
  const mockIssue: Issue = {
    _id: "issue1" as Id<"issues">,
    title: "Test Issue",
    key: "TEST-1",
    status: "todo",
    priority: "medium",
    type: "task",
    order: 1,
    labels: [],
    updatedAt: 1234567890,
  };

  const baseProps: KanbanColumnProps = {
    state: { id: "todo", name: "To Do", category: "todo", order: 0 },
    issues: [mockIssue],
    columnIndex: 0,
    selectionMode: false,
    selectedIssueIds: new Set(),
    canEdit: true,
    onIssueDrop: vi.fn(),
    onIssueReorder: vi.fn(),
    onIssueClick: vi.fn(),
    onToggleSelect: vi.fn(),
    focusedIssueId: null,
  };

  it("should return true when focusedIssueId changes but is unrelated to the column", () => {
    const prev = { ...baseProps, focusedIssueId: "issueA" as Id<"issues"> };
    const next = { ...baseProps, focusedIssueId: "issueB" as Id<"issues"> };

    // This is the optimization target: unrelated focus change should NOT trigger re-render
    const result = arePropsEqual(prev, next);

    expect(result).toBe(true);
  });

  it("should return false when focusedIssueId changes and affects an issue in the column", () => {
    // focusedIssueId moves TO an issue in this column
    const prev = { ...baseProps, focusedIssueId: "issueA" as Id<"issues"> };
    const next = { ...baseProps, focusedIssueId: "issue1" as Id<"issues"> }; // issue1 is in the column

    expect(arePropsEqual(prev, next)).toBe(false);
  });

  it("should return false when focusedIssueId changes FROM an issue in the column", () => {
    // focusedIssueId moves FROM an issue in this column
    const prev = { ...baseProps, focusedIssueId: "issue1" as Id<"issues"> };
    const next = { ...baseProps, focusedIssueId: "issueB" as Id<"issues"> };

    expect(arePropsEqual(prev, next)).toBe(false);
  });

  it("should return false when other props change", () => {
    const prev = { ...baseProps };
    const next = { ...baseProps, columnIndex: 1 };

    expect(arePropsEqual(prev, next)).toBe(false);
  });
});

describe("areKanbanIssueItemPropsEqual", () => {
  const mockIssue: Issue = {
    _id: "issue1" as Id<"issues">,
    title: "Test Issue",
    key: "TEST-1",
    status: "todo",
    priority: "medium",
    type: "task",
    order: 1,
    labels: [],
    updatedAt: 1234567890,
  };

  const baseItemProps = {
    issue: mockIssue,
    columnIndex: 0,
    index: 0,
    onClick: vi.fn(),
    selectionMode: false,
    isSelected: false,
    isFocused: false,
    onToggleSelect: vi.fn(),
    canEdit: true,
  };

  it("should return true when issue content is same even if reference changes", () => {
    const prev = { ...baseItemProps };
    const next = { ...baseItemProps, issue: { ...mockIssue } }; // New reference

    expect(areKanbanIssueItemPropsEqual(prev, next)).toBe(true);
  });

  it("should return false when issue content changes", () => {
    const prev = { ...baseItemProps };
    const next = {
      ...baseItemProps,
      issue: { ...mockIssue, title: "New Title", updatedAt: 1234567891 },
    };

    expect(areKanbanIssueItemPropsEqual(prev, next)).toBe(false);
  });

  it("should return false when other props change", () => {
    const prev = { ...baseItemProps };
    const next = { ...baseItemProps, isSelected: true };

    expect(areKanbanIssueItemPropsEqual(prev, next)).toBe(false);
  });
});
