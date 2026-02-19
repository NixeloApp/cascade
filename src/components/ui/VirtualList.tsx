/**
 * VirtualList component for efficient rendering of large lists
 *
 * Uses react-window for virtualization - only renders visible items plus overscan buffer.
 * Perfect for Kanban columns with 50+ cards.
 */

import { type CSSProperties, type ElementType, forwardRef, useEffect, useRef } from "react";
import * as ReactWindow from "react-window";
import { cn } from "@/lib/utils";

// Manually define the props interface since default export types are failing
export interface ListChildComponentProps<T = unknown> {
  index: number;
  style: CSSProperties;
  data: T;
  isScrolling?: boolean;
}

// Cast ReactWindow to access FixedSizeList while satisfying "no any" rule by using unknown
const FixedSizeList = (ReactWindow as unknown as { FixedSizeList: ElementType }).FixedSizeList;

export interface VirtualListProps<T> {
  /** Items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the list container */
  height: number;
  /** Width of the list container (default: 100%) */
  width?: number | string;
  /** Number of items to render outside visible area (default: 3) */
  overscan?: number;
  /** Optional className for the list container */
  className?: string;
  /** Optional callback when list is scrolled */
  onScroll?: (scrollOffset: number) => void;
  /** Optional callback when scroll reaches near the end */
  onEndReached?: () => void;
  /** Threshold in pixels from bottom to trigger onEndReached (default: 100) */
  endReachedThreshold?: number;
}

interface ItemData<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
}

function ItemRenderer<T>({ index, style, data }: ListChildComponentProps<ItemData<T>>) {
  const { items, renderItem } = data;
  const item = items[index];

  if (!item) return null;

  return <div style={style}>{renderItem(item, index)}</div>;
}

/**
 * VirtualList component for efficient rendering of large lists
 *
 * @example
 * <VirtualList
 *   items={issues}
 *   renderItem={(issue, index) => <IssueCard key={issue._id} issue={issue} />}
 *   itemHeight={80}
 *   height={600}
 *   onEndReached={loadMore}
 * />
 */
function VirtualListInner<T>(
  {
    items,
    renderItem,
    itemHeight,
    height,
    width = "100%",
    overscan = 3,
    className,
    onScroll,
    onEndReached,
    endReachedThreshold = 100,
  }: VirtualListProps<T>,
  ref: React.ForwardedRef<unknown>,
) {
  // Track if onEndReached has been called to prevent multiple calls
  const endReachedCalledRef = useRef(false);
  const prevItemCountRef = useRef(items.length);

  // Reset the endReachedCalled flag when items change (new data loaded)
  // Using useEffect to avoid direct ref mutation during render
  useEffect(() => {
    if (items.length !== prevItemCountRef.current) {
      endReachedCalledRef.current = false;
      prevItemCountRef.current = items.length;
    }
  }, [items.length]);

  const itemData: ItemData<T> = {
    items,
    renderItem,
  };

  return (
    <FixedSizeList
      ref={ref}
      className={cn("scrollbar-thin", className)}
      height={height}
      width={width}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={itemData}
      overscanCount={overscan}
      onScroll={({ scrollOffset }: { scrollOffset: number }) => {
        onScroll?.(scrollOffset);

        // Check if we're near the end
        if (onEndReached) {
          const totalHeight = items.length * itemHeight;
          const scrollBottom = scrollOffset + height;
          const distanceFromEnd = totalHeight - scrollBottom;

          if (distanceFromEnd <= endReachedThreshold) {
            // Only call if not already called since last items change
            if (!endReachedCalledRef.current) {
              endReachedCalledRef.current = true;
              onEndReached();
            }
          } else if (distanceFromEnd > endReachedThreshold * 2) {
            // Reset when user scrolls back up far enough
            endReachedCalledRef.current = false;
          }
        }
      }}
    >
      {ItemRenderer}
    </FixedSizeList>
  );
}

// Export with proper typing for forwardRef with generics
export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<unknown> },
) => React.ReactElement;
