import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useAsyncMutation } from "./useAsyncMutation";

// Mock the toast module
vi.mock("../lib/toast", () => ({
  showError: vi.fn(),
}));

import { showError } from "../lib/toast";

describe("useAsyncMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("should have isLoading false initially", () => {
      const mockMutation = vi.fn();
      const { result } = renderHook(() => useAsyncMutation(mockMutation));

      expect(result.current.isLoading).toBe(false);
    });

    it("should have no error initially", () => {
      const mockMutation = vi.fn();
      const { result } = renderHook(() => useAsyncMutation(mockMutation));

      expect(result.current.error).toBeNull();
    });

    it("should provide a mutate function", () => {
      const mockMutation = vi.fn();
      const { result } = renderHook(() => useAsyncMutation(mockMutation));

      expect(typeof result.current.mutate).toBe("function");
    });
  });

  describe("successful mutation", () => {
    it("should set isLoading true during mutation", async () => {
      let resolvePromise: (value: string) => void;
      const mockMutation = vi.fn(
        () =>
          new Promise<string>((resolve) => {
            resolvePromise = resolve;
          }),
      );

      const { result } = renderHook(() => useAsyncMutation(mockMutation));

      // Start the mutation
      let mutatePromise: Promise<string | undefined>;
      act(() => {
        mutatePromise = result.current.mutate();
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!("success");
        await mutatePromise;
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });

    it("should return the mutation result", async () => {
      const mockMutation = vi.fn().mockResolvedValue({ id: "123", name: "Test" });
      const { result } = renderHook(() =>
        useAsyncMutation<[], { id: string; name: string }>(mockMutation),
      );

      let mutationResult: { id: string; name: string } | undefined;
      await act(async () => {
        mutationResult = await result.current.mutate();
      });

      expect(mutationResult).toEqual({ id: "123", name: "Test" });
    });

    it("should call onSuccess callback with result", async () => {
      const mockMutation = vi.fn().mockResolvedValue("result");
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useAsyncMutation(mockMutation, { onSuccess }));

      await act(async () => {
        await result.current.mutate();
      });

      expect(onSuccess).toHaveBeenCalledWith("result");
    });

    it("should pass arguments to mutation function", async () => {
      const mockMutation = vi.fn().mockResolvedValue("done");
      const { result } = renderHook(() => useAsyncMutation(mockMutation));

      await act(async () => {
        await result.current.mutate("arg1", 123, { key: "value" });
      });

      expect(mockMutation).toHaveBeenCalledWith("arg1", 123, { key: "value" });
    });

    it("should clear previous error on new mutation", async () => {
      const mockMutation = vi
        .fn()
        .mockRejectedValueOnce(new Error("First error"))
        .mockResolvedValueOnce("success");

      const { result } = renderHook(() =>
        useAsyncMutation(mockMutation, { showErrorToast: false }),
      );

      // First mutation fails
      await act(async () => {
        await result.current.mutate();
      });
      expect(result.current.error).not.toBeNull();

      // Second mutation succeeds
      await act(async () => {
        await result.current.mutate();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe("failed mutation", () => {
    it("should set error state on failure", async () => {
      const mockMutation = vi.fn().mockRejectedValue(new Error("Test error"));
      const { result } = renderHook(() =>
        useAsyncMutation(mockMutation, { showErrorToast: false }),
      );

      await act(async () => {
        await result.current.mutate();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Test error");
    });

    it("should return undefined on failure", async () => {
      const mockMutation = vi.fn().mockRejectedValue(new Error("Test error"));
      const { result } = renderHook(() =>
        useAsyncMutation(mockMutation, { showErrorToast: false }),
      );

      let mutationResult: unknown;
      await act(async () => {
        mutationResult = await result.current.mutate();
      });

      expect(mutationResult).toBeUndefined();
    });

    it("should call onError callback", async () => {
      const mockMutation = vi.fn().mockRejectedValue(new Error("Test error"));
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useAsyncMutation(mockMutation, { onError, showErrorToast: false }),
      );

      await act(async () => {
        await result.current.mutate();
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should show error toast by default", async () => {
      const mockMutation = vi.fn().mockRejectedValue(new Error("Test error"));
      const { result } = renderHook(() => useAsyncMutation(mockMutation));

      await act(async () => {
        await result.current.mutate();
      });

      expect(showError).toHaveBeenCalledWith(expect.any(Error), "Operation failed");
    });

    it("should use custom error message in toast", async () => {
      const mockMutation = vi.fn().mockRejectedValue(new Error("Test error"));
      const { result } = renderHook(() =>
        useAsyncMutation(mockMutation, { errorMessage: "Custom error message" }),
      );

      await act(async () => {
        await result.current.mutate();
      });

      expect(showError).toHaveBeenCalledWith(expect.any(Error), "Custom error message");
    });

    it("should not show toast when showErrorToast is false", async () => {
      const mockMutation = vi.fn().mockRejectedValue(new Error("Test error"));
      const { result } = renderHook(() =>
        useAsyncMutation(mockMutation, { showErrorToast: false }),
      );

      await act(async () => {
        await result.current.mutate();
      });

      expect(showError).not.toHaveBeenCalled();
    });

    it("should convert non-Error throws to Error", async () => {
      const mockMutation = vi.fn().mockRejectedValue("string error");
      const { result } = renderHook(() =>
        useAsyncMutation(mockMutation, { showErrorToast: false }),
      );

      await act(async () => {
        await result.current.mutate();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("string error");
    });

    it("should set isLoading false after failure", async () => {
      const mockMutation = vi.fn().mockRejectedValue(new Error("Test error"));
      const { result } = renderHook(() =>
        useAsyncMutation(mockMutation, { showErrorToast: false }),
      );

      await act(async () => {
        await result.current.mutate();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("multiple mutations", () => {
    it("should handle sequential mutations", async () => {
      const mockMutation = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");

      const { result } = renderHook(() => useAsyncMutation<[], string>(mockMutation));

      let firstResult: string | undefined;
      let secondResult: string | undefined;

      await act(async () => {
        firstResult = await result.current.mutate();
      });

      await act(async () => {
        secondResult = await result.current.mutate();
      });

      expect(firstResult).toBe("first");
      expect(secondResult).toBe("second");
      expect(mockMutation).toHaveBeenCalledTimes(2);
    });

    it("should track loading state correctly across mutations", async () => {
      let resolveFirst: (v: string) => void;
      let resolveSecond: (v: string) => void;

      const mockMutation = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<string>((resolve) => {
              resolveFirst = resolve;
            }),
        )
        .mockImplementationOnce(
          () =>
            new Promise<string>((resolve) => {
              resolveSecond = resolve;
            }),
        );

      const { result } = renderHook(() => useAsyncMutation<[], string>(mockMutation));

      // Start first mutation
      let firstPromise: Promise<string | undefined>;
      act(() => {
        firstPromise = result.current.mutate();
      });
      expect(result.current.isLoading).toBe(true);

      // Resolve first
      await act(async () => {
        resolveFirst!("first");
        await firstPromise;
      });
      expect(result.current.isLoading).toBe(false);

      // Start second mutation
      let secondPromise: Promise<string | undefined>;
      act(() => {
        secondPromise = result.current.mutate();
      });
      expect(result.current.isLoading).toBe(true);

      // Resolve second
      await act(async () => {
        resolveSecond!("second");
        await secondPromise;
      });
      expect(result.current.isLoading).toBe(false);
    });
  });
});
