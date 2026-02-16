import { describe, expect, it } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import type { EnrichedIssue } from "../../convex/lib/issueHelpers";
import { getSwimlanId } from "./swimlane-utils";

// Mock issue factory
const createIssue = (overrides: Partial<EnrichedIssue> = {}): EnrichedIssue => ({
  _id: "issue1" as Id<"issues">,
  _creationTime: Date.now(),
  projectId: "project1" as Id<"projects">,
  organizationId: "org1" as Id<"organizations">,
  workspaceId: "workspace1" as Id<"workspaces">,
  teamId: "team1" as Id<"teams">,
  key: "TEST-1",
  title: "Test Issue",
  description: "Description",
  searchContent: "Test Issue Description",
  status: "todo",
  priority: "medium",
  type: "task",
  assigneeId: undefined,
  assignee: null,
  reporterId: "user1" as Id<"users">,
  reporter: null,
  updatedAt: Date.now(),
  labels: [],
  linkedDocuments: [],
  attachments: [],
  loggedHours: 0,
  order: 0,
  epicId: undefined,
  epic: null,
  ...overrides,
});

describe("swimlane-utils", () => {
  describe("getSwimlanId", () => {
    it("should return priority", () => {
      const issue = createIssue({ priority: "high" });
      expect(getSwimlanId(issue, "priority")).toBe("high");
    });

    it("should return assignee id when assigned", () => {
      const issue = createIssue({
        assigneeId: "user1" as Id<"users">,
        assignee: { _id: "user1" as Id<"users">, name: "User 1" },
      });
      expect(getSwimlanId(issue, "assignee")).toBe("user1");
    });

    it("should return unassigned when no assignee", () => {
      const issue = createIssue({ assigneeId: undefined, assignee: null });
      expect(getSwimlanId(issue, "assignee")).toBe("unassigned");
    });

    it("should return type", () => {
      const issue = createIssue({ type: "bug" });
      expect(getSwimlanId(issue, "type")).toBe("bug");
    });

    it("should return first label name", () => {
      const issue = createIssue({
        labels: [
          {
            name: "Backend",
            color: "#000000",
          },
        ],
      });
      expect(getSwimlanId(issue, "label")).toBe("Backend");
    });

    it("should return unlabeled when no labels", () => {
      const issue = createIssue({ labels: [] });
      expect(getSwimlanId(issue, "label")).toBe("unlabeled");
    });

    it("should return all for default", () => {
      const issue = createIssue();
      expect(getSwimlanId(issue, "none")).toBe("all");
    });
  });
});
