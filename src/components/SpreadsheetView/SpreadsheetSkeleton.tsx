/**
 * SpreadsheetSkeleton - Loading state for spreadsheet view
 */

import { Skeleton } from "@/components/ui/Skeleton";

interface SpreadsheetSkeletonProps {
  columns: number;
  rows: number;
}

export function SpreadsheetSkeleton({ columns, rows }: SpreadsheetSkeletonProps) {
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse">
        <thead className="bg-ui-bg-soft border-b border-ui-border">
          <tr>
            {/* Title column */}
            <th className="h-11 px-3 min-w-80 border-r border-ui-border">
              <Skeleton className="h-4 w-16" />
            </th>
            {/* Property columns */}
            {Array.from({ length: columns }).map((_, i) => (
              <th
                key={`header-${i.toString()}`}
                className="h-11 px-3 w-32 border-r border-ui-border/50"
              >
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={`row-${rowIndex.toString()}`} className="border-b border-ui-border">
              {/* Title column */}
              <td className="h-11 px-3 border-r border-ui-border">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </td>
              {/* Property columns */}
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td
                  key={`cell-${rowIndex.toString()}-${colIndex.toString()}`}
                  className="h-11 px-3 border-r border-ui-border/50"
                >
                  <Skeleton className="h-5 w-16" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
