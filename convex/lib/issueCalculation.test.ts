import { describe, expect, it } from "vitest";
import type { Doc } from "../_generated/dataModel";
import { calculateIssueCounts, INITIAL_COUNTS } from "./issueCalculation";

describe("calculateIssueCounts", () => {
  // Helper to create minimal issue objects
  const createIssue = (status: string, updatedAt: number): Doc<"issues"> =>
    ({
      status,
      updatedAt,
      // Casting as unknown then Doc<"issues"> avoids needing all fields since the function only uses status and updatedAt.
    }) as unknown as Doc<"issues">;

  const statusMap = {
    "todo-status": "todo",
    "doing-status": "inprogress",
    "done-status": "done",
  };

  it("should return initial counts for empty list", () => {
    const counts = calculateIssueCounts([], statusMap, 0);
    expect(counts).toEqual(INITIAL_COUNTS);
  });

  it("should count issues by category", () => {
    const issues = [
      createIssue("todo-status", 100),
      createIssue("todo-status", 100),
      createIssue("doing-status", 100),
    ];
    const counts = calculateIssueCounts(issues, statusMap, 0);

    expect(counts.total.todo).toBe(2);
    expect(counts.total.inprogress).toBe(1);
    expect(counts.total.done).toBe(0);

    // Visible counts should match total for non-done items
    expect(counts.visible.todo).toBe(2);
    expect(counts.visible.inprogress).toBe(1);
  });

  it("should split done issues into visible and hidden based on threshold", () => {
    const threshold = 500;
    const issues = [
      createIssue("done-status", 600), // Updated after threshold -> Visible
      createIssue("done-status", 400), // Updated before threshold -> Hidden
      createIssue("done-status", 500), // Exact match -> Visible (>=)
    ];

    const counts = calculateIssueCounts(issues, statusMap, threshold);

    expect(counts.total.done).toBe(3);
    expect(counts.visible.done).toBe(2); // 600 and 500
    expect(counts.hidden.done).toBe(1); // 400
  });

  it("should default unknown statuses to 'todo'", () => {
    const issues = [createIssue("unknown-status", 100)];
    const counts = calculateIssueCounts(issues, statusMap, 0);

    expect(counts.total.todo).toBe(1);
    expect(counts.visible.todo).toBe(1);
  });

  it("should work with Map for status mapping", () => {
    const map = new Map([
      ["todo-status", "todo"],
      ["doing-status", "inprogress"],
    ]);
    const issues = [createIssue("todo-status", 100), createIssue("doing-status", 100)];
    const counts = calculateIssueCounts(issues, map, 0);

    expect(counts.total.todo).toBe(1);
    expect(counts.total.inprogress).toBe(1);
  });
});
