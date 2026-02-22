/**
 * DateCell - Inline date picker
 */

import { format } from "date-fns";
import { Calendar, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Calendar as CalendarPicker } from "@/components/ui/Calendar";
import { Flex } from "@/components/ui/Flex";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";

interface DateCellProps {
  date?: number;
  onUpdate?: (date: number | undefined) => void;
}

export function DateCell({ date, onUpdate }: DateCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formattedDate = date ? format(new Date(date), "MMM d, yyyy") : null;

  const content = formattedDate ? (
    <Flex
      align="center"
      gap="xs"
      className={cn(
        "cursor-pointer px-1.5 py-0.5 rounded transition-colors text-sm",
        onUpdate && "hover:bg-ui-bg-secondary",
      )}
    >
      <Calendar className="w-3 h-3 text-ui-text-tertiary" />
      <span>{formattedDate}</span>
    </Flex>
  ) : (
    <Flex
      align="center"
      gap="xs"
      className={cn(
        "cursor-pointer px-1.5 py-0.5 rounded transition-colors text-ui-text-tertiary text-sm",
        onUpdate && "hover:bg-ui-bg-secondary hover:text-ui-text-secondary",
      )}
    >
      <Calendar className="w-3 h-3" />
      <span>No date</span>
    </Flex>
  );

  if (!onUpdate) {
    return content;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{content}</PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <CalendarPicker
          mode="single"
          selected={date ? new Date(date) : undefined}
          onSelect={(selectedDate) => {
            onUpdate(selectedDate?.getTime());
            setIsOpen(false);
          }}
          initialFocus
        />
        {date && (
          <div className="border-t border-ui-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-status-error-text"
              onClick={() => {
                onUpdate(undefined);
                setIsOpen(false);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
