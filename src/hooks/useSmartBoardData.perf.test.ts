import { describe, expect, it } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import type { EnrichedIssue } from "../../convex/lib/issueHelpers";
import { mergeIssuesByStatus } from "./useSmartBoardData";

// Helper to create mock issues
const createIssue = (id: string, status: string): EnrichedIssue => ({
  _id: id as Id<"issues">,
  status,
  // Minimal other fields required by type, though not used by function
  _creationTime: Date.now(),
  title: "Test Issue",
  priority: "medium",
  type: "task",
  projectId: "p1" as Id<"projects">,
  organizationId: "org1" as Id<"organizations">,
  workspaceId: "ws1" as Id<"workspaces">,
  reporterId: "u1" as Id<"users">,
  key: "PROJ-1",
  labels: [],
  linkedDocuments: [],
  attachments: [],
  assigneeId: undefined,
  assignee: null,
  reporter: null,
  epic: null,
  order: 0,
  updatedAt: Date.now(),
});

describe("mergeIssuesByStatus Performance", () => {
  it("should merge large datasets efficiently", () => {
    const STATUS = "done";
    const INITIAL_COUNT = 5000;
    const ADDITIONAL_COUNT = 5000;

    // Create initial issues
    const smartIssues: Record<string, EnrichedIssue[]> = {
      [STATUS]: Array.from({ length: INITIAL_COUNT }, (_, i) =>
        createIssue(`initial-${i}`, STATUS),
      ),
      todo: [],
      inprogress: [],
    };

    // Create additional issues (some new, some duplicates)
    const additionalIssues: EnrichedIssue[] = [
      // 50% duplicates
      ...Array.from({ length: ADDITIONAL_COUNT / 2 }, (_, i) =>
        createIssue(`initial-${i}`, STATUS),
      ),
      // 50% new
      ...Array.from({ length: ADDITIONAL_COUNT / 2 }, (_, i) => createIssue(`new-${i}`, STATUS)),
      // Internal duplicate (should be deduplicated)
      createIssue("new-0", STATUS),
    ];

    const start = performance.now();
    const result = mergeIssuesByStatus(smartIssues, additionalIssues);
    const end = performance.now();

    const duration = end - start;
    console.log(`Merge duration: ${duration.toFixed(2)}ms`);

    // Verification
    const expectedCount = INITIAL_COUNT + ADDITIONAL_COUNT / 2;
    expect(result[STATUS].length).toBe(expectedCount);

    // Performance expectation (lenient for CI)
    // O(N*M) would be slow (~2000 * 500 = 1M ops).
    // O(N+M) would be fast (~2500 ops).
    // 1M ops in JS might take 10-100ms depending on environment.
    // 2500 ops takes < 1ms.

    // We expect it to be fast.
    expect(duration).toBeLessThan(100);
  });
});
