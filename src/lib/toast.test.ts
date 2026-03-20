import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "./test-ids";
import {
  getErrorMessage,
  showCreated,
  showDeleted,
  showError,
  showFailedOperation,
  showInfo,
  showSuccess,
  showUpdated,
} from "./toast";

// Mock the sonner toast module
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Import the mocked toast to access it in tests
import { toast } from "sonner";

describe("toast utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getErrorMessage", () => {
    it("should extract message from Error instance", () => {
      const error = new Error("Something went wrong");
      expect(getErrorMessage(error)).toBe("Something went wrong");
    });

    it("should return string error as-is", () => {
      const error = "Simple error message";
      expect(getErrorMessage(error)).toBe("Simple error message");
    });

    it("should return default fallback for unknown error types", () => {
      expect(getErrorMessage(null)).toBe("An error occurred");
      expect(getErrorMessage(undefined)).toBe("An error occurred");
      expect(getErrorMessage(123)).toBe("An error occurred");
      expect(getErrorMessage({})).toBe("An error occurred");
      expect(getErrorMessage([])).toBe("An error occurred");
    });

    it("should use custom fallback message", () => {
      const customFallback = "Custom error message";
      expect(getErrorMessage(null, customFallback)).toBe(customFallback);
      expect(getErrorMessage({}, customFallback)).toBe(customFallback);
    });

    it("should handle Error with empty message", () => {
      const error = new Error("");
      expect(getErrorMessage(error)).toBe("");
    });

    it("should handle TypeError", () => {
      const error = new TypeError("Type error occurred");
      expect(getErrorMessage(error)).toBe("Type error occurred");
    });

    it("should handle custom Error subclasses", () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "CustomError";
        }
      }
      const error = new CustomError("Custom error message");
      expect(getErrorMessage(error)).toBe("Custom error message");
    });

    it("should handle empty string error", () => {
      expect(getErrorMessage("")).toBe("");
    });
  });

  describe("showSuccess", () => {
    it("should call toast.success with the message", () => {
      const message = "Operation successful";
      showSuccess(message);

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(message, { testId: TEST_IDS.TOAST.SUCCESS });
    });

    it("should work with different messages", () => {
      showSuccess("First message");
      showSuccess("Second message");

      expect(toast.success).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenNthCalledWith(1, "First message", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
      expect(toast.success).toHaveBeenNthCalledWith(2, "Second message", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
    });

    it("should handle empty string", () => {
      showSuccess("");
      expect(toast.success).toHaveBeenCalledWith("", { testId: TEST_IDS.TOAST.SUCCESS });
    });
  });

  describe("showInfo", () => {
    it("should call toast.info with the message and info test id", () => {
      showInfo("Heads up");

      expect(toast.info).toHaveBeenCalledTimes(1);
      expect(toast.info).toHaveBeenCalledWith("Heads up", { testId: TEST_IDS.TOAST.INFO });
    });
  });

  describe("showError", () => {
    it("should call toast.error with Error message", () => {
      const error = new Error("Something failed");
      showError(error);

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith("Something failed", {
        testId: TEST_IDS.TOAST.ERROR,
      });
    });

    it("should call toast.error with string error", () => {
      showError("Error message");

      expect(toast.error).toHaveBeenCalledWith("Error message", {
        testId: TEST_IDS.TOAST.ERROR,
      });
    });

    it("should use default fallback for unknown errors", () => {
      showError(null);

      expect(toast.error).toHaveBeenCalledWith("An error occurred", {
        testId: TEST_IDS.TOAST.ERROR,
      });
    });

    it("should use custom fallback message", () => {
      showError(null, "Custom fallback");

      expect(toast.error).toHaveBeenCalledWith("Custom fallback", {
        testId: TEST_IDS.TOAST.ERROR,
      });
    });

    it("should handle different error types", () => {
      showError(new TypeError("Type error"));
      expect(toast.error).toHaveBeenCalledWith("Type error", {
        testId: TEST_IDS.TOAST.ERROR,
      });

      showError(new RangeError("Range error"));
      expect(toast.error).toHaveBeenCalledWith("Range error", {
        testId: TEST_IDS.TOAST.ERROR,
      });
    });
  });

  describe("showCreated", () => {
    it("should show success message for created entity", () => {
      showCreated("Project");

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith("Project created successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
    });

    it("should work with different entity names", () => {
      showCreated("Issue");
      showCreated("Sprint");
      showCreated("Document");

      expect(toast.success).toHaveBeenCalledTimes(3);
      expect(toast.success).toHaveBeenNthCalledWith(1, "Issue created successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
      expect(toast.success).toHaveBeenNthCalledWith(2, "Sprint created successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
      expect(toast.success).toHaveBeenNthCalledWith(3, "Document created successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
    });

    it("should handle lowercase entity names", () => {
      showCreated("task");
      expect(toast.success).toHaveBeenCalledWith("task created successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
    });
  });

  describe("showUpdated", () => {
    it("should show success message for updated entity", () => {
      showUpdated("Project");

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith("Project updated successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
    });

    it("should work with different entity names", () => {
      showUpdated("Issue");
      showUpdated("Sprint");
      showUpdated("Settings");

      expect(toast.success).toHaveBeenCalledTimes(3);
      expect(toast.success).toHaveBeenNthCalledWith(1, "Issue updated successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
      expect(toast.success).toHaveBeenNthCalledWith(2, "Sprint updated successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
      expect(toast.success).toHaveBeenNthCalledWith(3, "Settings updated successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
    });
  });

  describe("showDeleted", () => {
    it("should show success message for deleted entity", () => {
      showDeleted("Project");

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith("Project deleted successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
    });

    it("should work with different entity names", () => {
      showDeleted("Issue");
      showDeleted("Comment");
      showDeleted("Attachment");

      expect(toast.success).toHaveBeenCalledTimes(3);
      expect(toast.success).toHaveBeenNthCalledWith(1, "Issue deleted successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
      expect(toast.success).toHaveBeenNthCalledWith(2, "Comment deleted successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
      expect(toast.success).toHaveBeenNthCalledWith(3, "Attachment deleted successfully", {
        testId: TEST_IDS.TOAST.SUCCESS,
      });
    });
  });

  describe("showFailedOperation", () => {
    it("should show error with extracted message", () => {
      const error = new Error("Database connection failed");
      showFailedOperation("create project", error);

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith("Database connection failed", {
        testId: TEST_IDS.TOAST.ERROR,
      });
    });

    it("should use operation in fallback message", () => {
      showFailedOperation("delete issue", null);

      expect(toast.error).toHaveBeenCalledWith("Failed to delete issue", {
        testId: TEST_IDS.TOAST.ERROR,
      });
    });

    it("should work with string errors", () => {
      showFailedOperation("update sprint", "Network error");

      expect(toast.error).toHaveBeenCalledWith("Network error", {
        testId: TEST_IDS.TOAST.ERROR,
      });
    });

    it("should handle different operations", () => {
      showFailedOperation("create", null);
      showFailedOperation("update", null);
      showFailedOperation("delete", null);

      expect(toast.error).toHaveBeenNthCalledWith(1, "Failed to create", {
        testId: TEST_IDS.TOAST.ERROR,
      });
      expect(toast.error).toHaveBeenNthCalledWith(2, "Failed to update", {
        testId: TEST_IDS.TOAST.ERROR,
      });
      expect(toast.error).toHaveBeenNthCalledWith(3, "Failed to delete", {
        testId: TEST_IDS.TOAST.ERROR,
      });
    });

    it("should prefer error message over operation fallback", () => {
      const error = new Error("Specific error reason");
      showFailedOperation("save data", error);

      expect(toast.error).toHaveBeenCalledWith("Specific error reason", {
        testId: TEST_IDS.TOAST.ERROR,
      });
      expect(toast.error).not.toHaveBeenCalledWith("Failed to save data", {
        testId: TEST_IDS.TOAST.ERROR,
      });
    });
  });

  describe("integration scenarios", () => {
    it("should support typical CRUD success flow", () => {
      showCreated("Project");
      showUpdated("Project");
      showDeleted("Project");

      expect(toast.success).toHaveBeenCalledTimes(3);
    });

    it("should support error handling flow", () => {
      const error = new Error("Validation failed");

      showError(error);
      showFailedOperation("create project", error);

      expect(toast.error).toHaveBeenCalledTimes(2);
      expect(toast.error).toHaveBeenCalledWith("Validation failed", {
        testId: TEST_IDS.TOAST.ERROR,
      });
    });

    it("should not interfere between success and error toasts", () => {
      showSuccess("Operation completed");
      showError("Operation failed");

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });
});
