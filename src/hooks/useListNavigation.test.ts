import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useListNavigation } from "./useListNavigation";

describe("useListNavigation", () => {
  const mockItems = ["Item 1", "Item 2", "Item 3", "Item 4"];
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to dispatch keyboard events
  function dispatchKeyDown(key: string) {
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      window.dispatchEvent(event);
    });
  }

  describe("initial state", () => {
    it("should start with no selection", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      expect(result.current.selectedIndex).toBe(-1);
    });

    it("should provide listRef", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      expect(result.current.listRef).not.toBeUndefined();
      expect(typeof result.current.listRef).toBe("object");
      expect(result.current.listRef).toHaveProperty("current");
    });
  });

  describe("arrow key navigation", () => {
    it("should navigate down with ArrowDown", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      dispatchKeyDown("ArrowDown");
      expect(result.current.selectedIndex).toBe(0);

      dispatchKeyDown("ArrowDown");
      expect(result.current.selectedIndex).toBe(1);

      dispatchKeyDown("ArrowDown");
      expect(result.current.selectedIndex).toBe(2);
    });

    it("should navigate up with ArrowUp", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      // Start by going to the last item (ArrowUp from -1)
      dispatchKeyDown("ArrowUp");
      expect(result.current.selectedIndex).toBe(3);

      dispatchKeyDown("ArrowUp");
      expect(result.current.selectedIndex).toBe(2);

      dispatchKeyDown("ArrowUp");
      expect(result.current.selectedIndex).toBe(1);
    });

    it("should loop from last to first with ArrowDown when loop=true", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
          loop: true,
        }),
      );

      // Go to last item
      act(() => {
        result.current.setSelectedIndex(3);
      });

      dispatchKeyDown("ArrowDown");
      expect(result.current.selectedIndex).toBe(0);
    });

    it("should loop from first to last with ArrowUp when loop=true", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
          loop: true,
        }),
      );

      // Go to first item
      act(() => {
        result.current.setSelectedIndex(0);
      });

      dispatchKeyDown("ArrowUp");
      expect(result.current.selectedIndex).toBe(3);
    });

    it("should not loop when loop=false", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
          loop: false,
        }),
      );

      // Go to last item
      act(() => {
        result.current.setSelectedIndex(3);
      });

      dispatchKeyDown("ArrowDown");
      expect(result.current.selectedIndex).toBe(3); // Should stay at last

      // Go to first item
      act(() => {
        result.current.setSelectedIndex(0);
      });

      dispatchKeyDown("ArrowUp");
      expect(result.current.selectedIndex).toBe(0); // Should stay at first
    });
  });

  describe("Home and End keys", () => {
    it("should go to first item with Home key", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      // Start somewhere in the middle
      act(() => {
        result.current.setSelectedIndex(2);
      });

      dispatchKeyDown("Home");
      expect(result.current.selectedIndex).toBe(0);
    });

    it("should go to last item with End key", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      // Start at the beginning
      act(() => {
        result.current.setSelectedIndex(0);
      });

      dispatchKeyDown("End");
      expect(result.current.selectedIndex).toBe(3);
    });
  });

  describe("Enter key selection", () => {
    it("should call onSelect when Enter is pressed with valid selection", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      // Select an item
      act(() => {
        result.current.setSelectedIndex(1);
      });

      dispatchKeyDown("Enter");
      expect(mockOnSelect).toHaveBeenCalledWith("Item 2", 1);
    });

    it("should not call onSelect when no item is selected", () => {
      renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      dispatchKeyDown("Enter");
      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe("Escape key", () => {
    it("should clear selection when Escape is pressed", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      // Select an item
      act(() => {
        result.current.setSelectedIndex(2);
      });
      expect(result.current.selectedIndex).toBe(2);

      dispatchKeyDown("Escape");
      expect(result.current.selectedIndex).toBe(-1);
    });
  });

  describe("enabled flag", () => {
    it("should not respond to keys when enabled=false", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
          enabled: false,
        }),
      );

      dispatchKeyDown("ArrowDown");
      expect(result.current.selectedIndex).toBe(-1);

      dispatchKeyDown("Home");
      expect(result.current.selectedIndex).toBe(-1);
    });

    it("should respond to keys when enabled=true", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
          enabled: true,
        }),
      );

      dispatchKeyDown("ArrowDown");
      expect(result.current.selectedIndex).toBe(0);
    });
  });

  describe("empty items", () => {
    it("should not respond to navigation with empty items", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: [],
          onSelect: mockOnSelect,
        }),
      );

      dispatchKeyDown("ArrowDown");
      expect(result.current.selectedIndex).toBe(-1);

      dispatchKeyDown("ArrowUp");
      expect(result.current.selectedIndex).toBe(-1);
    });
  });

  describe("getItemProps", () => {
    it("should return correct props for unselected item", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      const props = result.current.getItemProps(0);
      expect(props["data-list-index"]).toBe(0);
      expect(props.className).toBe("");
    });

    it("should return selected class for selected item", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      act(() => {
        result.current.setSelectedIndex(1);
      });

      const props = result.current.getItemProps(1);
      expect(props.className).toBe("ring-2 ring-brand");

      // Other items should not have selected class
      const otherProps = result.current.getItemProps(0);
      expect(otherProps.className).toBe("");
    });

    it("should update selection on mouse enter", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      const props = result.current.getItemProps(2);
      act(() => {
        props.onMouseEnter();
      });

      expect(result.current.selectedIndex).toBe(2);
    });
  });

  describe("setSelectedIndex", () => {
    it("should allow manual selection", () => {
      const { result } = renderHook(() =>
        useListNavigation({
          items: mockItems,
          onSelect: mockOnSelect,
        }),
      );

      act(() => {
        result.current.setSelectedIndex(2);
      });

      expect(result.current.selectedIndex).toBe(2);
    });
  });
});
