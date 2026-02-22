/**
 * GanttSkeleton - Loading state for Gantt view
 */

import { Flex } from "@/components/ui/Flex";
import { Skeleton } from "@/components/ui/Skeleton";

export function GanttSkeleton() {
  return (
    <Flex direction="column" className="h-full">
      {/* Toolbar */}
      <Flex align="center" justify="between" className="border-b border-ui-border px-4 py-2">
        <Flex align="center" gap="sm">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-16 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-32 ml-2" />
        </Flex>
        <Skeleton className="h-5 w-32" />
      </Flex>

      {/* Chart */}
      <Flex className="flex-1">
        {/* Sidebar */}
        <div className="w-72 border-r border-ui-border bg-ui-bg-soft p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Flex key={`sidebar-${i.toString()}`} align="center" gap="sm" className="mb-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
            </Flex>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Flex key={`bar-${i.toString()}`} className="mb-3">
              <div className="w-1/3 ml-[10%]">
                <Skeleton className="h-8 rounded w-full" />
              </div>
            </Flex>
          ))}
        </div>
      </Flex>
    </Flex>
  );
}
