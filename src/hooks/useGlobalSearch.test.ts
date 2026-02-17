import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSearchKeyboard, useSearchPagination } from "./useGlobalSearch";

describe("useSearchKeyboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start with isOpen false", () => {
    const { result } = renderHook(() => useSearchKeyboard());

    expect(result.current.isOpen).toBe(false);
  });

  it("should open on Cmd+K", () => {
    const { result } = renderHook(() => useSearchKeyboard());

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("should open on Ctrl+K", () => {
    const { result } = renderHook(() => useSearchKeyboard());

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("should close on Escape", () => {
    const { result } = renderHook(() => useSearchKeyboard());

    // Open first
    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);

    // Close with Escape
    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("should allow manual setIsOpen", () => {
    const { result } = renderHook(() => useSearchKeyboard());

    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.setIsOpen(false);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("should not open without modifier key", () => {
    const { result } = renderHook(() => useSearchKeyboard());

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "k",
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("should clean up event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = renderHook(() => useSearchKeyboard());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});

describe("useSearchPagination", () => {
  it("should have default values", () => {
    const { result } = renderHook(() => useSearchPagination(true));

    expect(result.current.query).toBe("");
    expect(result.current.activeTab).toBe("all");
    expect(result.current.issueOffset).toBe(0);
    expect(result.current.documentOffset).toBe(0);
    expect(result.current.limit).toBe(20);
  });

  it("should update query and reset offsets", () => {
    const { result } = renderHook(() => useSearchPagination(true));

    // First load some pages
    act(() => {
      result.current.loadMore(true, true);
    });
    expect(result.current.issueOffset).toBe(20);
    expect(result.current.documentOffset).toBe(20);

    // Now set query - offsets should reset
    act(() => {
      result.current.setQuery("test query");
    });

    expect(result.current.query).toBe("test query");
    expect(result.current.issueOffset).toBe(0);
    expect(result.current.documentOffset).toBe(0);
  });

  it("should change active tab", () => {
    const { result } = renderHook(() => useSearchPagination(true));

    act(() => {
      result.current.setActiveTab("issues");
    });

    expect(result.current.activeTab).toBe("issues");

    act(() => {
      result.current.setActiveTab("documents");
    });

    expect(result.current.activeTab).toBe("documents");
  });

  it("should load more issues on all tab", () => {
    const { result } = renderHook(() => useSearchPagination(true));

    act(() => {
      result.current.loadMore(true, false);
    });

    expect(result.current.issueOffset).toBe(20);
    expect(result.current.documentOffset).toBe(0);
  });

  it("should load more documents on all tab", () => {
    const { result } = renderHook(() => useSearchPagination(true));

    act(() => {
      result.current.loadMore(false, true);
    });

    expect(result.current.issueOffset).toBe(0);
    expect(result.current.documentOffset).toBe(20);
  });

  it("should load more both on all tab when both have more", () => {
    const { result } = renderHook(() => useSearchPagination(true));

    act(() => {
      result.current.loadMore(true, true);
    });

    expect(result.current.issueOffset).toBe(20);
    expect(result.current.documentOffset).toBe(20);
  });

  it("should only load issues on issues tab", () => {
    const { result } = renderHook(() => useSearchPagination(true));

    act(() => {
      result.current.setActiveTab("issues");
    });

    act(() => {
      result.current.loadMore(true, true);
    });

    expect(result.current.issueOffset).toBe(20);
    expect(result.current.documentOffset).toBe(0);
  });

  it("should only load documents on documents tab", () => {
    const { result } = renderHook(() => useSearchPagination(true));

    act(() => {
      result.current.setActiveTab("documents");
    });

    act(() => {
      result.current.loadMore(true, true);
    });

    expect(result.current.issueOffset).toBe(0);
    expect(result.current.documentOffset).toBe(20);
  });

  it("should not load more when hasMore is false", () => {
    const { result } = renderHook(() => useSearchPagination(true));

    act(() => {
      result.current.loadMore(false, false);
    });

    expect(result.current.issueOffset).toBe(0);
    expect(result.current.documentOffset).toBe(0);
  });

  it("should reset state when isOpen becomes false", () => {
    const { result, rerender } = renderHook(({ isOpen }) => useSearchPagination(isOpen), {
      initialProps: { isOpen: true },
    });

    // Set some state
    act(() => {
      result.current.setQuery("test");
      result.current.loadMore(true, true);
    });

    expect(result.current.query).toBe("test");
    expect(result.current.issueOffset).toBe(20);
    expect(result.current.documentOffset).toBe(20);

    // Close the search
    rerender({ isOpen: false });

    expect(result.current.query).toBe("");
    expect(result.current.issueOffset).toBe(0);
    expect(result.current.documentOffset).toBe(0);
  });

  it("should increment offsets correctly on multiple loadMore calls", () => {
    const { result } = renderHook(() => useSearchPagination(true));

    act(() => {
      result.current.loadMore(true, true);
    });
    expect(result.current.issueOffset).toBe(20);
    expect(result.current.documentOffset).toBe(20);

    act(() => {
      result.current.loadMore(true, true);
    });
    expect(result.current.issueOffset).toBe(40);
    expect(result.current.documentOffset).toBe(40);

    act(() => {
      result.current.loadMore(true, true);
    });
    expect(result.current.issueOffset).toBe(60);
    expect(result.current.documentOffset).toBe(60);
  });
});
