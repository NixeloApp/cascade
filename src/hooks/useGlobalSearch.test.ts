import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, renderHook } from "@/test/custom-render";
import {
  resetGlobalSearchStateForTests,
  useSearchKeyboard,
  useSearchPagination,
} from "./useGlobalSearch";

const SEARCH_QUERY = "billing";
const PAGINATION_LIMIT = 20;
const FIRST_OFFSET = 20;
const SECOND_OFFSET = 40;

describe("useGlobalSearch", () => {
  beforeEach(() => {
    resetGlobalSearchStateForTests();
  });

  afterEach(() => {
    resetGlobalSearchStateForTests();
  });

  it("opens and closes the search dialog from keyboard shortcuts and setter updates", () => {
    const { result } = renderHook(() => useSearchKeyboard());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.setIsOpen(false);
    });

    expect(result.current.isOpen).toBe(false);

    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("rehydrates persisted open state after a transient remount", () => {
    const firstRender = renderHook(() => useSearchKeyboard());

    act(() => {
      firstRender.result.current.setIsOpen(true);
    });

    expect(firstRender.result.current.isOpen).toBe(true);

    firstRender.unmount();

    const secondRender = renderHook(() => useSearchKeyboard());

    expect(secondRender.result.current.isOpen).toBe(true);
  });

  it("persists pagination state across remounts while open and resets it when closing", () => {
    const firstRender = renderHook(
      ({ isOpen }: { isOpen: boolean }) => useSearchPagination(isOpen),
      { initialProps: { isOpen: true } },
    );

    expect(firstRender.result.current.limit).toBe(PAGINATION_LIMIT);

    act(() => {
      firstRender.result.current.setQuery(SEARCH_QUERY);
      firstRender.result.current.setActiveTab("documents");
    });

    act(() => {
      firstRender.result.current.loadMore(true, true);
    });

    expect(firstRender.result.current.query).toBe(SEARCH_QUERY);
    expect(firstRender.result.current.activeTab).toBe("documents");
    expect(firstRender.result.current.issueOffset).toBe(0);
    expect(firstRender.result.current.documentOffset).toBe(FIRST_OFFSET);

    firstRender.unmount();

    const secondRender = renderHook(
      ({ isOpen }: { isOpen: boolean }) => useSearchPagination(isOpen),
      { initialProps: { isOpen: true } },
    );

    expect(secondRender.result.current.query).toBe(SEARCH_QUERY);
    expect(secondRender.result.current.activeTab).toBe("documents");
    expect(secondRender.result.current.issueOffset).toBe(0);
    expect(secondRender.result.current.documentOffset).toBe(FIRST_OFFSET);

    act(() => {
      secondRender.result.current.setActiveTab("all");
    });

    act(() => {
      secondRender.result.current.loadMore(true, true);
    });

    expect(secondRender.result.current.issueOffset).toBe(FIRST_OFFSET);
    expect(secondRender.result.current.documentOffset).toBe(SECOND_OFFSET);

    secondRender.rerender({ isOpen: false });

    expect(secondRender.result.current.query).toBe("");
    expect(secondRender.result.current.activeTab).toBe("all");
    expect(secondRender.result.current.issueOffset).toBe(0);
    expect(secondRender.result.current.documentOffset).toBe(0);
  });
});
