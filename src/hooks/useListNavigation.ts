import { useEffect, useRef, useState } from "react";

/**
 * Hook for keyboard navigation in lists
 * Handles arrow keys, Enter, and Escape
 */
export function useListNavigation<T>({
  items,
  onSelect,
  enabled = true,
  loop = true,
}: {
  items: T[];
  onSelect: (item: T, index: number) => void;
  enabled?: boolean;
  loop?: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset selection on mount
  useEffect(() => setSelectedIndex(-1), []);

  // Refs for stable keyboard handler
  const stateRef = useRef({ items, onSelect, selectedIndex });
  stateRef.current = { items, onSelect, selectedIndex };

  useEffect(() => {
    if (!enabled) return;

    const getNextIndex = (current: number, length: number) => {
      if (current < length - 1) return current + 1;
      return loop ? 0 : current;
    };

    const getPrevIndex = (current: number, length: number) => {
      if (current > 0) return current - 1;
      if (current === -1) return length - 1;
      return loop ? length - 1 : current;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const { items: list, onSelect: select, selectedIndex: idx } = stateRef.current;
      if (list.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => getNextIndex(prev, list.length));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => getPrevIndex(prev, list.length));
          break;
        case "Enter":
          if (idx >= 0 && idx < list.length) {
            e.preventDefault();
            select(list[idx], idx);
          }
          break;
        case "Escape":
          e.preventDefault();
          setSelectedIndex(-1);
          break;
        case "Home":
          e.preventDefault();
          setSelectedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setSelectedIndex(list.length - 1);
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, loop]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-list-index="${selectedIndex}"]`);
      (el as HTMLElement | null)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedIndex]);

  return {
    selectedIndex,
    setSelectedIndex,
    listRef,
    getItemProps: (index: number) => ({
      "data-list-index": index,
      className: selectedIndex === index ? "ring-2 ring-brand" : "",
      onMouseEnter: () => setSelectedIndex(index),
    }),
  };
}
