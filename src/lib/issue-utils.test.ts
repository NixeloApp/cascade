import { describe, expect, it } from "vitest";
import {
  getPriorityColor,
  getStatusColor,
  getTypeLabel,
  ISSUE_TYPE_ICONS,
  PRIORITY_ICONS,
} from "./issue-utils";

describe("issue-utils", () => {
  describe("ISSUE_TYPE_ICONS", () => {
    it("should have icon for all issue types", () => {
      expect(ISSUE_TYPE_ICONS.bug).toBeDefined();
      expect(ISSUE_TYPE_ICONS.story).toBeDefined();
      expect(ISSUE_TYPE_ICONS.epic).toBeDefined();
      expect(ISSUE_TYPE_ICONS.subtask).toBeDefined();
      expect(ISSUE_TYPE_ICONS.task).toBeDefined();
    });
  });

  describe("PRIORITY_ICONS", () => {
    it("should have icon for all priorities", () => {
      expect(PRIORITY_ICONS.highest).toBeDefined();
      expect(PRIORITY_ICONS.high).toBeDefined();
      expect(PRIORITY_ICONS.medium).toBeDefined();
      expect(PRIORITY_ICONS.low).toBeDefined();
      expect(PRIORITY_ICONS.lowest).toBeDefined();
    });
  });

  describe("getPriorityColor", () => {
    describe("text variant", () => {
      it("should return correct color for highest priority", () => {
        expect(getPriorityColor("highest", "text")).toBe("text-priority-highest");
      });

      it("should return correct color for high priority", () => {
        expect(getPriorityColor("high", "text")).toBe("text-priority-high");
      });

      it("should return correct color for medium priority", () => {
        expect(getPriorityColor("medium", "text")).toBe("text-priority-medium");
      });

      it("should return correct color for low priority", () => {
        expect(getPriorityColor("low", "text")).toBe("text-priority-low");
      });

      it("should return correct color for lowest priority", () => {
        expect(getPriorityColor("lowest", "text")).toBe("text-priority-lowest");
      });

      it("should default to lowest for unknown priority", () => {
        expect(getPriorityColor("unknown", "text")).toBe("text-priority-lowest");
      });

      it("should use text variant as default", () => {
        expect(getPriorityColor("high")).toBe("text-priority-high");
      });
    });

    describe("bg variant", () => {
      it("should return correct color for highest priority", () => {
        expect(getPriorityColor("highest", "bg")).toBe("bg-status-error-bg text-status-error-text");
      });

      it("should return correct color for high priority", () => {
        expect(getPriorityColor("high", "bg")).toBe(
          "bg-status-warning-bg text-status-warning-text",
        );
      });

      it("should return correct color for medium priority", () => {
        expect(getPriorityColor("medium", "bg")).toBe(
          "bg-status-warning-bg text-status-warning-text",
        );
      });

      it("should return correct color for low priority", () => {
        expect(getPriorityColor("low", "bg")).toBe("bg-status-info-bg text-status-info-text");
      });

      it("should return correct color for lowest priority", () => {
        expect(getPriorityColor("lowest", "bg")).toBe("bg-ui-bg-tertiary text-ui-text-secondary");
      });

      it("should default to lowest for unknown priority", () => {
        expect(getPriorityColor("unknown", "bg")).toBe("bg-ui-bg-tertiary text-ui-text-secondary");
      });
    });

    describe("badge variant", () => {
      it("should return correct color for highest priority", () => {
        expect(getPriorityColor("highest", "badge")).toBe(
          "text-priority-highest bg-status-error-bg",
        );
      });

      it("should return correct color for high priority", () => {
        expect(getPriorityColor("high", "badge")).toBe("text-priority-high bg-status-warning-bg");
      });

      it("should return correct color for medium priority", () => {
        expect(getPriorityColor("medium", "badge")).toBe(
          "text-priority-medium bg-status-warning-bg",
        );
      });

      it("should return correct color for low priority", () => {
        expect(getPriorityColor("low", "badge")).toBe("text-priority-low bg-status-info-bg");
      });

      it("should return correct color for lowest priority", () => {
        expect(getPriorityColor("lowest", "badge")).toBe("text-priority-lowest bg-ui-bg-tertiary");
      });
    });
  });

  describe("getTypeLabel", () => {
    it("should return correct label for bug type", () => {
      expect(getTypeLabel("bug")).toBe("Bug");
    });

    it("should return correct label for story type", () => {
      expect(getTypeLabel("story")).toBe("Story");
    });

    it("should return correct label for epic type", () => {
      expect(getTypeLabel("epic")).toBe("Epic");
    });

    it("should return correct label for subtask type", () => {
      expect(getTypeLabel("subtask")).toBe("Sub-task");
    });

    it("should return correct label for task type", () => {
      expect(getTypeLabel("task")).toBe("Task");
    });

    it("should return default label for unknown type", () => {
      expect(getTypeLabel("unknown")).toBe("Task");
      expect(getTypeLabel("")).toBe("Task");
    });
  });

  describe("getStatusColor", () => {
    it("should return success colors for active status", () => {
      const expected = "bg-status-success-bg text-status-success-text";
      expect(getStatusColor("active")).toBe(expected);
      expect(getStatusColor("Active")).toBe(expected);
      expect(getStatusColor("ACTIVE")).toBe(expected);
    });

    it("should return success colors for in progress status", () => {
      const expected = "bg-status-success-bg text-status-success-text";
      expect(getStatusColor("in progress")).toBe(expected);
      expect(getStatusColor("In Progress")).toBe(expected);
      expect(getStatusColor("IN PROGRESS")).toBe(expected);
    });

    it("should return tertiary colors for completed status", () => {
      const expected = "bg-ui-bg-tertiary text-ui-text-secondary";
      expect(getStatusColor("completed")).toBe(expected);
      expect(getStatusColor("Completed")).toBe(expected);
      expect(getStatusColor("COMPLETED")).toBe(expected);
    });

    it("should return tertiary colors for done status", () => {
      const expected = "bg-ui-bg-tertiary text-ui-text-secondary";
      expect(getStatusColor("done")).toBe(expected);
      expect(getStatusColor("Done")).toBe(expected);
      expect(getStatusColor("DONE")).toBe(expected);
    });

    it("should return info colors for future status", () => {
      const expected = "bg-status-info-bg text-status-info-text";
      expect(getStatusColor("future")).toBe(expected);
      expect(getStatusColor("Future")).toBe(expected);
      expect(getStatusColor("FUTURE")).toBe(expected);
    });

    it("should return info colors for todo status", () => {
      const expected = "bg-status-info-bg text-status-info-text";
      expect(getStatusColor("todo")).toBe(expected);
      expect(getStatusColor("Todo")).toBe(expected);
      expect(getStatusColor("TODO")).toBe(expected);
    });

    it("should return error colors for blocked status", () => {
      const expected = "bg-status-error-bg text-status-error-text";
      expect(getStatusColor("blocked")).toBe(expected);
      expect(getStatusColor("Blocked")).toBe(expected);
      expect(getStatusColor("BLOCKED")).toBe(expected);
    });

    it("should return default tertiary for unknown status", () => {
      const expected = "bg-ui-bg-tertiary text-ui-text-secondary";
      expect(getStatusColor("unknown")).toBe(expected);
      expect(getStatusColor("")).toBe(expected);
      expect(getStatusColor("custom-status")).toBe(expected);
    });
  });
});
