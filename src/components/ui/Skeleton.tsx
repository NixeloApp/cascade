/**
 * Skeleton Component
 *
 * Placeholder loading states with shimmer animation.
 * Includes presets for cards, lists, and text blocks.
 * Use to maintain layout during async data loading.
 */

import { cn } from "@/lib/utils";
import { Flex } from "./Flex";

interface SkeletonProps {
  className?: string;
}

/**
 * Base Skeleton component with shimmer animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-shimmer bg-ui-bg-soft rounded-md", className)} />;
}

/**
 * Skeleton for card-shaped content with optional padding
 */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-ui-bg border border-ui-border rounded-lg p-4", className)}>
      <Flex direction="column" gap="md">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </Flex>
    </div>
  );
}

/**
 * Skeleton for text lines with varying widths
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const lineItems = Array.from({ length: lines }, (_, i) => ({
    id: `skeleton-text-${i}`,
    index: i,
  }));

  return (
    <Flex direction="column" gap="sm" className={className}>
      {lineItems.map((item) => (
        <Skeleton
          key={item.id}
          className={cn(
            "h-4",
            item.index === lines - 1 ? "w-4/5" : item.index % 2 === 0 ? "w-full" : "w-11/12",
          )}
        />
      ))}
    </Flex>
  );
}

/**
 * Skeleton for circular avatars
 */
export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return <Skeleton className={cn("rounded-full", sizeClasses[size])} />;
}

/**
 * Skeleton for table rows
 */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  const rowItems = Array.from({ length: rows }, (_, i) => `skeleton-row-${i}`);

  return (
    <Flex direction="column" gap="sm">
      {rowItems.map((rowId) => (
        <Flex key={rowId} align="center" gap="lg" className="p-3 bg-ui-bg-secondary rounded">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </Flex>
      ))}
    </Flex>
  );
}

/**
 * Skeleton for list items (issues, documents, etc.)
 */
export function SkeletonList({ items = 5 }: { items?: number }) {
  const listItems = Array.from({ length: items }, (_, i) => `skeleton-item-${i}`);

  return (
    <Flex direction="column" gap="sm">
      {listItems.map((itemId) => (
        <div key={itemId} className="p-3 bg-ui-bg-secondary rounded-lg">
          <Flex align="start" gap="md">
            <SkeletonAvatar size="sm" />
            <Flex direction="column" gap="sm" className="flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </Flex>
          </Flex>
        </div>
      ))}
    </Flex>
  );
}

/**
 * Skeleton for stat cards (Dashboard stats)
 */
export function SkeletonStatCard() {
  return (
    <div className="bg-ui-bg border border-ui-border rounded-lg p-4">
      <Flex direction="column" gap="md" className="text-center">
        <Skeleton className="h-3 w-24 mx-auto" />
        <Skeleton className="h-10 w-16 mx-auto" />
        <Skeleton className="h-3 w-20 mx-auto" />
      </Flex>
    </div>
  );
}

/**
 * Skeleton for kanban cards
 */
export function SkeletonKanbanCard() {
  return (
    <Flex direction="column" gap="sm" className="bg-ui-bg border border-ui-border rounded-lg p-3">
      <Flex align="center" gap="sm">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </Flex>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Flex align="center" gap="sm" className="pt-2">
        <SkeletonAvatar size="sm" />
        <Skeleton className="h-3 w-20" />
      </Flex>
    </Flex>
  );
}

/**
 * Skeleton for project cards
 */
export function SkeletonProjectCard() {
  return (
    <Flex direction="column" gap="sm" className="p-3 bg-ui-bg-secondary rounded-lg">
      <Flex align="center" justify="between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16" />
      </Flex>
      <Skeleton className="h-3 w-3/4" />
    </Flex>
  );
}
