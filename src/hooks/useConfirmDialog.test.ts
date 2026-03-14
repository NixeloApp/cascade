import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@/test/custom-render";
import { useConfirmDialog } from "./useConfirmDialog";

const CUSTOM_CONFIRM_LABEL = "Delete";
const DEFAULT_CONFIRM_LABEL = "Confirm";
const DANGER_VARIANT = "danger";
const WARNING_VARIANT = "warning";

function createDeferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("useConfirmDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts closed and resets back to the initial state when closed", () => {
    const { result } = renderHook(() => useConfirmDialog());

    expect(result.current.dialogState).toEqual({
      isOpen: false,
      title: "",
      message: "",
      confirmLabel: DEFAULT_CONFIRM_LABEL,
      variant: WARNING_VARIANT,
    });
    expect(result.current.isConfirming).toBe(false);

    act(() => {
      result.current.openConfirm({
        title: "Delete issue",
        message: "This cannot be undone.",
        confirmLabel: CUSTOM_CONFIRM_LABEL,
        variant: DANGER_VARIANT,
      });
    });

    expect(result.current.dialogState).toEqual({
      isOpen: true,
      title: "Delete issue",
      message: "This cannot be undone.",
      confirmLabel: CUSTOM_CONFIRM_LABEL,
      variant: DANGER_VARIANT,
    });

    act(() => {
      result.current.closeConfirm();
    });

    expect(result.current.dialogState).toEqual({
      isOpen: false,
      title: "",
      message: "",
      confirmLabel: DEFAULT_CONFIRM_LABEL,
      variant: WARNING_VARIANT,
    });
  });

  it("sets loading during a successful async confirmation and closes afterwards", async () => {
    const deferred = createDeferred();
    const action = vi.fn(() => deferred.promise);
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.openConfirm({
        title: "Archive sprint",
        message: "Archive this sprint and hide it from active boards.",
        confirmLabel: "Archive",
        variant: "info",
      });
    });

    let confirmationPromise!: Promise<void>;
    act(() => {
      confirmationPromise = result.current.handleConfirm(action);
    });

    expect(result.current.isConfirming).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.dialogState.isOpen).toBe(true);

    await act(async () => {
      deferred.resolve();
      await confirmationPromise;
    });

    expect(result.current.isConfirming).toBe(false);
    expect(result.current.dialogState).toEqual({
      isOpen: false,
      title: "",
      message: "",
      confirmLabel: DEFAULT_CONFIRM_LABEL,
      variant: WARNING_VARIANT,
    });
  });

  it("clears loading but keeps the dialog open when confirmation fails", async () => {
    const deferred = createDeferred();
    const error = new Error("delete failed");
    const action = vi.fn(() => deferred.promise);
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.openConfirm({
        title: "Delete team",
        message: "This action cannot be undone.",
      });
    });

    let confirmationPromise!: Promise<void>;
    act(() => {
      confirmationPromise = result.current.handleConfirm(action);
    });

    expect(result.current.isConfirming).toBe(true);

    let caughtError: unknown;
    await act(async () => {
      deferred.reject(error);
      try {
        await confirmationPromise;
      } catch (caught) {
        caughtError = caught;
      }
    });

    expect(caughtError).toBe(error);
    expect(result.current.isConfirming).toBe(false);

    expect(result.current.dialogState).toEqual({
      isOpen: true,
      title: "Delete team",
      message: "This action cannot be undone.",
    });
  });
});
