/**
 * SpreadsheetHeader - Column headers with sorting and property toggle
 */

import { ChevronDown, Columns, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex } from "@/components/ui/Flex";
import { cn } from "@/lib/utils";
import type { ColumnDefinition, DisplayProperties } from "./SpreadsheetView";
import { SPREADSHEET_COLUMNS } from "./SpreadsheetView";

interface SpreadsheetHeaderProps {
  columns: ColumnDefinition[];
  displayProperties: DisplayProperties;
  onToggleProperty: (property: keyof DisplayProperties) => void;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  allSelected: boolean;
  onSelectAll: () => void;
}

export function SpreadsheetHeader({
  columns,
  displayProperties,
  onToggleProperty,
  selectionMode,
  onToggleSelectionMode,
  allSelected,
  onSelectAll,
}: SpreadsheetHeaderProps) {
  return (
    <thead className="bg-ui-bg-soft border-b border-ui-border sticky top-0 z-10">
      <tr>
        {/* Selection / Title column */}
        <th className="sticky left-0 z-20 bg-ui-bg-soft border-r border-ui-border min-w-80">
          <Flex align="center" gap="sm" className="h-11 px-3">
            {selectionMode ? (
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all issues"
              />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSelectionMode}
                className="h-6 w-6 p-0"
                aria-label="Enable selection mode"
              >
                <Columns className="h-4 w-4 text-ui-text-tertiary" />
              </Button>
            )}
            <span className="font-medium text-ui-text text-sm">Title</span>
          </Flex>
        </th>

        {/* Property columns */}
        {columns.map((column) => (
          <th
            key={column.id}
            className={cn(
              "h-11 px-3 text-left font-medium text-ui-text text-sm border-r border-ui-border/50 last:border-r-0",
              column.width,
            )}
          >
            <Flex align="center" gap="xs">
              {column.label}
              {column.sortable && (
                <ChevronDown className="h-3 w-3 text-ui-text-tertiary opacity-0 group-hover:opacity-100" />
              )}
            </Flex>
          </th>
        ))}

        {/* Settings column */}
        <th className="w-10 h-11 px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label="Configure columns"
              >
                <Settings2 className="h-4 w-4 text-ui-text-tertiary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Display Properties</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SPREADSHEET_COLUMNS.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={displayProperties[column.id]}
                  onCheckedChange={() => onToggleProperty(column.id)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </th>
      </tr>
    </thead>
  );
}
