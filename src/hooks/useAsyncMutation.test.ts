import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@/test/custom-render";
import { showError } from "../lib/toast";
import { useAsyncMutation } from "./useAsyncMutation";

vi.mock("../lib/toast", () => ({
  showError: vi.fn(),
}));

function createDeferred<TResult>() {
  let resolve!: (value: TResult) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<TResult>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("useAsyncMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the mutation result, toggles loading state, and clears prior errors on success", async () => {
    const deferred = createDeferred<{ ok: boolean }>();
    const mutationFn = vi.fn((issueId: string, attempt: number) => {
      expect(issueId).toBeTypeOf("string");
      expect(attempt).toBeTypeOf("number");
      return deferred.promise;
    });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useAsyncMutation(mutationFn, {
        onSuccess,
      }),
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    let mutationResult: { ok: boolean } | undefined;
    let pendingMutation!: Promise<{ ok: boolean } | undefined>;

    act(() => {
      pendingMutation = result.current.mutate("issue_1", 3);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      deferred.resolve({ ok: true });
      mutationResult = await pendingMutation;
    });

    expect(mutationFn).toHaveBeenCalledWith("issue_1", 3);
    expect(mutationResult).toEqual({ ok: true });
    expect(onSuccess).toHaveBeenCalledWith({ ok: true });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(showError).not.toHaveBeenCalled();
  });

  it("normalizes thrown values to Error instances and reports them through callbacks and toast", async () => {
    const onError = vi.fn();
    const mutationFn = vi.fn(async (_id: string) => {
      throw "request failed";
    });

    const { result } = renderHook(() =>
      useAsyncMutation(mutationFn, {
        onError,
        errorMessage: "Unable to save webhook",
      }),
    );

    let mutationResult: string | undefined;

    await act(async () => {
      mutationResult = await result.current.mutate("webhook_1");
    });

    expect(mutationResult).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("request failed");
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "request failed" }));
    expect(showError).toHaveBeenCalledWith(expect.any(Error), "Unable to save webhook");
  });

  it("suppresses the error toast when showErrorToast is false", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() =>
      useAsyncMutation(mutationFn, {
        showErrorToast: false,
      }),
    );

    await act(async () => {
      await result.current.mutate();
    });

    expect(result.current.error).toEqual(expect.objectContaining({ message: "network down" }));
    expect(showError).not.toHaveBeenCalled();
  });
});
