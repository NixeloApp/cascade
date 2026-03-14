import { Search } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "./Input";

interface SearchFieldProps extends Omit<InputProps, "type" | "variant"> {
  iconClassName?: string;
}

export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ className, iconClassName, ...props }, ref) => {
    return (
      <div className="relative">
        <Search
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-text-tertiary",
            iconClassName,
          )}
        />
        <Input ref={ref} type="search" variant="search" className={className} {...props} />
      </div>
    );
  },
);

SearchField.displayName = "SearchField";
