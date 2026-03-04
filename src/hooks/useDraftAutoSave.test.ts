import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@/test/custom-render";
import { useDraftAutoSave } from "./useDraftAutoSave";

describe("useDraftAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should log save failures with storage context", () => {
    const warningSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const storageError = new Error("Quota exceeded");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw storageError;
    });

    const { result } = renderHook(() =>
      useDraftAutoSave<{ title: string }>({
        key: "create-issue",
        contextKey: "project-1",
        debounceMs: 10,
      }),
    );

    act(() => {
      result.current.saveDraft({ title: "Draft title" });
      vi.advanceTimersByTime(10);
    });

    expect(warningSpy).toHaveBeenCalledWith("Draft auto-save save failed", {
      storageKey: "cascade_draft_create-issue_project-1",
      error: storageError,
    });
  });

  it("should log load failures with storage context when stored draft is invalid", () => {
    const warningSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const parseError = new Error("Malformed JSON");
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("{not-json");
    const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {});
    vi.spyOn(JSON, "parse").mockImplementation(() => {
      throw parseError;
    });

    const { result } = renderHook(() =>
      useDraftAutoSave<{ title: string }>({
        key: "create-issue",
        contextKey: "project-1",
      }),
    );

    expect(result.current.hasDraft).toBe(false);
    expect(result.current.draft).toBeNull();
    expect(result.current.draftTimestamp).toBeNull();
    expect(warningSpy).toHaveBeenCalledWith("Draft auto-save load failed", {
      storageKey: "cascade_draft_create-issue_project-1",
      error: parseError,
    });
    expect(removeItemSpy).toHaveBeenCalledWith("cascade_draft_create-issue_project-1");
  });

  it("should cancel pending debounced save when clearDraft is called", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {});

    const { result } = renderHook(() =>
      useDraftAutoSave<{ title: string }>({
        key: "create-issue",
        contextKey: "project-1",
        debounceMs: 20,
      }),
    );

    act(() => {
      result.current.saveDraft({ title: "Will be cleared" });
      expect(result.current.hasDraft).toBe(false);
      result.current.clearDraft();
      vi.advanceTimersByTime(20);
    });

    expect(result.current.hasDraft).toBe(false);
    expect(removeItemSpy).toHaveBeenCalledWith("cascade_draft_create-issue_project-1");
    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
