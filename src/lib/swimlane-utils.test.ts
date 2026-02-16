import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import { describe, expect, it } from "vitest";
import {
  getSwimlanConfigs,
  getSwimlanGroupByLabel,
  getSwimlanGroupByOptions,
  getSwimlanId,
  getSwimlanIssueCount,
  groupIssuesBySwimlane,
  isSwimlanEmpty,
} from "./swimlane-utils";

// Mock EnrichedIssue factory
const createMockIssue = (overrides: Partial<EnrichedIssue> = {}): EnrichedIssue => ({
  _id: "issue1" as Id<"issues">,
  _creationTime: Date.now(),
  updatedAt: Date.now(),
  organizationId: "org1" as Id<"organizations">,
  workspaceId: "ws1" as Id<"workspaces">,
  teamId: "team1" as Id<"teams">,
  projectId: "project1" as Id<"projects">,
  key: "TEST-1",
  title: "Test Issue",
  description: "Test description",
  status: "todo",
  priority: "medium",
  type: "task",
  assigneeId: undefined,
  reporterId: "user1" as Id<"users">,
  epicId: undefined,
  labels: [],
  assignee: null,
  reporter: {
    _id: "user1" as Id<"users">,
    name: "Reporter",
  },
  epic: null,
  isDeleted: false,
  order: 0,
  linkedDocuments: [],
  attachments: [],
  version: 1,
  ...overrides,
});

describe("swimlane-utils", () => {
  describe("getSwimlanId", () => {
    it("returns priority for priority grouping", () => {
      const issue = createMockIssue({ priority: "high" });
      expect(getSwimlanId(issue, "priority")).toBe("high");
    });

    it("returns assigneeId for assignee grouping when assigned", () => {
      const issue = createMockIssue({ assigneeId: "user1" as Id<"users"> });
      expect(getSwimlanId(issue, "assignee")).toBe("user1");
    });

    it("returns 'unassigned' for assignee grouping when unassigned", () => {
      const issue = createMockIssue({ assigneeId: undefined });
      expect(getSwimlanId(issue, "assignee")).toBe("unassigned");
    });

    it("returns type for type grouping", () => {
      const issue = createMockIssue({ type: "bug" });
      expect(getSwimlanId(issue, "type")).toBe("bug");
    });

    it("returns first label for label grouping", () => {
      const issue = createMockIssue({
        labels: [{ name: "frontend", color: "#000" }],
      });
      expect(getSwimlanId(issue, "label")).toBe("frontend");
    });

    it("returns 'unlabeled' for label grouping when no labels", () => {
      const issue = createMockIssue({ labels: [] });
      expect(getSwimlanId(issue, "label")).toBe("unlabeled");
    });

    it("returns 'all' for none grouping", () => {
      const issue = createMockIssue();
      expect(getSwimlanId(issue, "none")).toBe("all");
    });
  });

  describe("getSwimlanConfigs", () => {
    it("returns priority configs", () => {
      const issues = [createMockIssue()];
      const configs = getSwimlanConfigs("priority", issues);
      expect(configs).toHaveLength(5);
      expect(configs[0].id).toBe("highest");
      expect(configs[4].id).toBe("lowest");
    });

    it("returns assignee configs based on issues", () => {
      const issues = [
        createMockIssue({ assigneeId: "user1" as Id<"users"> }),
        createMockIssue({ assigneeId: "user2" as Id<"users"> }),
        createMockIssue({ assigneeId: undefined }),
      ];
      const assignees = new Map<Id<"users">, { name?: string; image?: string }>([
        ["user1" as Id<"users">, { name: "User 1" }],
        ["user2" as Id<"users">, { name: "User 2" }],
      ]);

      const configs = getSwimlanConfigs("assignee", issues, assignees);
      // user1, user2, unassigned
      expect(configs).toHaveLength(3);
      expect(configs.find((c) => c.id === "user1")?.name).toBe("User 1");
      expect(configs.find((c) => c.id === "user2")?.name).toBe("User 2");
      expect(configs.find((c) => c.id === "unassigned")?.name).toBe("Unassigned");
    });

    it("returns assignee configs without unassigned if all assigned", () => {
      const issues = [createMockIssue({ assigneeId: "user1" as Id<"users"> })];
      const assignees = new Map<Id<"users">, { name?: string; image?: string }>([
        ["user1" as Id<"users">, { name: "User 1" }],
      ]);

      const configs = getSwimlanConfigs("assignee", issues, assignees);
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toBe("user1");
    });

    it("returns empty assignee configs if no issues", () => {
      const issues: EnrichedIssue[] = [];
      const configs = getSwimlanConfigs("assignee", issues);
      expect(configs).toHaveLength(0);
    });

    it("handles missing assignees map", () => {
      const issues = [createMockIssue({ assigneeId: "user1" as Id<"users"> })];
      const configs = getSwimlanConfigs("assignee", issues);
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toBe("user1");
      expect(configs[0].name).toBe("Unknown");
    });

    it("returns type configs based on issues", () => {
      const issues = [createMockIssue({ type: "bug" }), createMockIssue({ type: "task" })];
      const configs = getSwimlanConfigs("type", issues);
      expect(configs).toHaveLength(2);
      expect(configs.map((c) => c.id).sort()).toEqual(["bug", "task"]);
    });

    it("returns label configs based on issues", () => {
      const issues = [
        createMockIssue({ labels: [{ name: "frontend", color: "#000" }] }),
        createMockIssue({ labels: [{ name: "backend", color: "#fff" }] }),
        createMockIssue({ labels: [] }),
      ];
      const labels = [
        { name: "frontend", color: "#000" },
        { name: "backend", color: "#fff" },
      ];

      const configs = getSwimlanConfigs("label", issues, undefined, labels);
      // frontend, backend, unlabeled
      expect(configs).toHaveLength(3);
      expect(configs.map((c) => c.id).sort()).toEqual(["backend", "frontend", "unlabeled"]);
    });

    it("returns label configs without unlabeled if all labeled", () => {
      const issues = [createMockIssue({ labels: [{ name: "frontend", color: "#000" }] })];
      const labels = [{ name: "frontend", color: "#000" }];

      const configs = getSwimlanConfigs("label", issues, undefined, labels);
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toBe("frontend");
    });

    it("returns 'All Issues' for none grouping", () => {
      const configs = getSwimlanConfigs("none", []);
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toBe("all");
    });
  });

  describe("groupIssuesBySwimlane", () => {
    it("groups issues by priority", () => {
      const issue1 = createMockIssue({
        _id: "1" as Id<"issues">,
        priority: "high",
        status: "todo",
      });
      const issue2 = createMockIssue({
        _id: "2" as Id<"issues">,
        priority: "medium",
        status: "todo",
      });
      const issuesByStatus = { todo: [issue1, issue2] };

      const result = groupIssuesBySwimlane(issuesByStatus, "priority");

      expect(result.high.todo).toHaveLength(1);
      expect(result.high.todo[0]._id).toBe("1");
      expect(result.medium.todo).toHaveLength(1);
      expect(result.medium.todo[0]._id).toBe("2");
    });

    it("groups multiple issues in same swimlane/status", () => {
      const issue1 = createMockIssue({
        _id: "1" as Id<"issues">,
        priority: "high",
        status: "todo",
      });
      const issue2 = createMockIssue({
        _id: "2" as Id<"issues">,
        priority: "high",
        status: "todo",
      });
      const issuesByStatus = { todo: [issue1, issue2] };

      const result = groupIssuesBySwimlane(issuesByStatus, "priority");

      expect(result.high.todo).toHaveLength(2);
      expect(result.high.todo[0]._id).toBe("1");
      expect(result.high.todo[1]._id).toBe("2");
    });

    it("returns single group for none grouping", () => {
      const issue1 = createMockIssue({ status: "todo" });
      const issuesByStatus = { todo: [issue1] };

      const result = groupIssuesBySwimlane(issuesByStatus, "none");

      expect(Object.keys(result)).toHaveLength(1);
      expect(result.all.todo).toHaveLength(1);
    });
  });

  describe("utility functions", () => {
    it("getSwimlanIssueCount counts all issues in a swimlane", () => {
      const issuesByStatus = {
        todo: [createMockIssue()],
        done: [createMockIssue(), createMockIssue()],
      };
      expect(getSwimlanIssueCount(issuesByStatus)).toBe(3);
    });

    it("isSwimlanEmpty returns true for empty swimlane", () => {
      const issuesByStatus = {
        todo: [],
        done: [],
      };
      expect(isSwimlanEmpty(issuesByStatus)).toBe(true);
    });

    it("isSwimlanEmpty returns false for non-empty swimlane", () => {
      const issuesByStatus = {
        todo: [createMockIssue()],
        done: [],
      };
      expect(isSwimlanEmpty(issuesByStatus)).toBe(false);
    });

    it("getSwimlanGroupByLabel returns correct labels", () => {
      expect(getSwimlanGroupByLabel("priority")).toBe("Priority");
      expect(getSwimlanGroupByLabel("assignee")).toBe("Assignee");
      expect(getSwimlanGroupByLabel("type")).toBe("Type");
      expect(getSwimlanGroupByLabel("label")).toBe("Label");
      expect(getSwimlanGroupByLabel("none")).toBe("No Swimlanes");
    });

    it("getSwimlanGroupByOptions returns all options", () => {
      const options = getSwimlanGroupByOptions();
      expect(options).toHaveLength(5);
      expect(options.map((o) => o.value)).toEqual([
        "none",
        "priority",
        "assignee",
        "type",
        "label",
      ]);
    });
  });
});
