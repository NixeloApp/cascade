import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useConfirmDialog } from "./useConfirmDialog";

describe("useConfirmDialog", () => {
  describe("initial state", () => {
    it("should have dialog closed initially", () => {
      const { result } = renderHook(() => useConfirmDialog());

      expect(result.current.dialogState.isOpen).toBe(false);
    });

    it("should have empty title and message initially", () => {
      const { result } = renderHook(() => useConfirmDialog());

      expect(result.current.dialogState.title).toBe("");
      expect(result.current.dialogState.message).toBe("");
    });

    it("should have default confirmLabel", () => {
      const { result } = renderHook(() => useConfirmDialog());

      expect(result.current.dialogState.confirmLabel).toBe("Confirm");
    });

    it("should have default variant as warning", () => {
      const { result } = renderHook(() => useConfirmDialog());

      expect(result.current.dialogState.variant).toBe("warning");
    });

    it("should not be confirming initially", () => {
      const { result } = renderHook(() => useConfirmDialog());

      expect(result.current.isConfirming).toBe(false);
    });
  });

  describe("openConfirm", () => {
    it("should open dialog with provided config", () => {
      const { result } = renderHook(() => useConfirmDialog());

      act(() => {
        result.current.openConfirm({
          title: "Delete Item",
          message: "Are you sure?",
        });
      });

      expect(result.current.dialogState.isOpen).toBe(true);
      expect(result.current.dialogState.title).toBe("Delete Item");
      expect(result.current.dialogState.message).toBe("Are you sure?");
    });

    it("should set custom confirmLabel", () => {
      const { result } = renderHook(() => useConfirmDialog());

      act(() => {
        result.current.openConfirm({
          title: "Delete",
          message: "Confirm deletion?",
          confirmLabel: "Delete Forever",
        });
      });

      expect(result.current.dialogState.confirmLabel).toBe("Delete Forever");
    });

    it("should set custom variant", () => {
      const { result } = renderHook(() => useConfirmDialog());

      act(() => {
        result.current.openConfirm({
          title: "Delete",
          message: "This is dangerous",
          variant: "danger",
        });
      });

      expect(result.current.dialogState.variant).toBe("danger");
    });

    it("should support info variant", () => {
      const { result } = renderHook(() => useConfirmDialog());

      act(() => {
        result.current.openConfirm({
          title: "Info",
          message: "Just FYI",
          variant: "info",
        });
      });

      expect(result.current.dialogState.variant).toBe("info");
    });
  });

  describe("closeConfirm", () => {
    it("should close dialog and reset state", () => {
      const { result } = renderHook(() => useConfirmDialog());

      // Open first
      act(() => {
        result.current.openConfirm({
          title: "Delete Item",
          message: "Are you sure?",
          confirmLabel: "Delete",
          variant: "danger",
        });
      });

      expect(result.current.dialogState.isOpen).toBe(true);

      // Close
      act(() => {
        result.current.closeConfirm();
      });

      expect(result.current.dialogState.isOpen).toBe(false);
      expect(result.current.dialogState.title).toBe("");
      expect(result.current.dialogState.message).toBe("");
      expect(result.current.dialogState.confirmLabel).toBe("Confirm");
      expect(result.current.dialogState.variant).toBe("warning");
    });
  });

  describe("handleConfirm", () => {
    it("should set isConfirming to true during action", async () => {
      const { result } = renderHook(() => useConfirmDialog());

      let resolveAction: () => void;
      const action = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveAction = resolve;
          }),
      );

      // Open dialog
      act(() => {
        result.current.openConfirm({
          title: "Test",
          message: "Testing",
        });
      });

      // Start confirm
      let confirmPromise: Promise<void>;
      act(() => {
        confirmPromise = result.current.handleConfirm(action);
      });

      // Should be confirming
      expect(result.current.isConfirming).toBe(true);

      // Resolve action
      await act(async () => {
        resolveAction?.();
        await confirmPromise;
      });

      // Should no longer be confirming
      expect(result.current.isConfirming).toBe(false);
    });

    it("should close dialog after successful action", async () => {
      const { result } = renderHook(() => useConfirmDialog());
      const action = vi.fn().mockResolvedValue(undefined);

      // Open dialog
      act(() => {
        result.current.openConfirm({
          title: "Test",
          message: "Testing",
        });
      });

      expect(result.current.dialogState.isOpen).toBe(true);

      // Confirm
      await act(async () => {
        await result.current.handleConfirm(action);
      });

      expect(result.current.dialogState.isOpen).toBe(false);
      expect(action).toHaveBeenCalled();
    });

    it("should reset isConfirming after action error", async () => {
      const { result } = renderHook(() => useConfirmDialog());
      const error = new Error("Action failed");
      const action = vi.fn().mockRejectedValue(error);

      // Open dialog
      act(() => {
        result.current.openConfirm({
          title: "Test",
          message: "Testing",
        });
      });

      // Confirm (should throw)
      await expect(
        act(async () => {
          await result.current.handleConfirm(action);
        }),
      ).rejects.toThrow("Action failed");

      // Should reset isConfirming even after error
      expect(result.current.isConfirming).toBe(false);
    });

    it("should support synchronous actions", async () => {
      const { result } = renderHook(() => useConfirmDialog());
      const action = vi.fn();

      // Open dialog
      act(() => {
        result.current.openConfirm({
          title: "Test",
          message: "Testing",
        });
      });

      // Confirm with sync action
      await act(async () => {
        await result.current.handleConfirm(action);
      });

      expect(action).toHaveBeenCalled();
      expect(result.current.dialogState.isOpen).toBe(false);
    });
  });

  describe("workflow scenarios", () => {
    it("should handle open -> close -> open workflow", () => {
      const { result } = renderHook(() => useConfirmDialog());

      // Open first time
      act(() => {
        result.current.openConfirm({
          title: "First",
          message: "First message",
        });
      });
      expect(result.current.dialogState.title).toBe("First");

      // Close
      act(() => {
        result.current.closeConfirm();
      });
      expect(result.current.dialogState.isOpen).toBe(false);

      // Open second time with different config
      act(() => {
        result.current.openConfirm({
          title: "Second",
          message: "Second message",
          variant: "danger",
        });
      });

      expect(result.current.dialogState.isOpen).toBe(true);
      expect(result.current.dialogState.title).toBe("Second");
      expect(result.current.dialogState.variant).toBe("danger");
    });

    it("should handle rapid open/close", () => {
      const { result } = renderHook(() => useConfirmDialog());

      // Rapid open/close
      act(() => {
        result.current.openConfirm({ title: "A", message: "A" });
        result.current.closeConfirm();
        result.current.openConfirm({ title: "B", message: "B" });
        result.current.closeConfirm();
        result.current.openConfirm({ title: "C", message: "C" });
      });

      expect(result.current.dialogState.isOpen).toBe(true);
      expect(result.current.dialogState.title).toBe("C");
    });
  });
});
