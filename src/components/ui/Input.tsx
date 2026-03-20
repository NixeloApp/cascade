/**
 * Input Component
 *
 * Text input with variant styling and optional addons.
 * Supports error states, search styling, and ghost variants.
 * variant="search" and variant="filter" automatically include the search icon.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { Search } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "./Typography";

const inputVariants = cva(
  "flex w-full rounded-lg border transition-[border-color,box-shadow] duration-default file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ui-text-tertiary focus-visible:outline-none focus-visible:border-ui-border-secondary focus-visible:shadow-soft disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-transparent text-ui-text border-ui-border",
        surface: "bg-ui-bg text-ui-text border-ui-border",
        search: "bg-ui-bg-soft text-ui-text pl-9 border-ui-border",
        filter:
          "pl-7 border-ui-border/45 bg-transparent text-ui-text-secondary placeholder:text-ui-text-tertiary hover:border-ui-border/60 focus-visible:border-ui-border-secondary focus-visible:bg-ui-bg-elevated/80 sm:pl-8 sm:border-ui-border/60 sm:bg-ui-bg-soft sm:text-ui-text",
        ghost: "border-transparent bg-transparent text-ui-text hover:bg-ui-bg-secondary",
        inlineEdit:
          "border-transparent bg-transparent text-ui-text hover:bg-ui-bg-hover hover:border-ui-border focus-visible:border-ui-border focus-visible:bg-ui-bg",
        error: "border-status-error focus-visible:border-status-error",
      },
      inputSize: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-4 text-base",
        filterPill: "h-8 rounded-full px-3 text-base sm:h-9 sm:rounded-xl sm:px-3 sm:text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  },
);

/** Variants that automatically include a search icon */
const ICON_VARIANTS = new Set(["search", "filter"]);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Error message to display */
  error?: string;
  /** Size variant for the input */
  inputSize?: "sm" | "md" | "lg" | "filterPill";
}

/**
 * Input component for text entry.
 *
 * @example
 * // Basic input
 * <Input placeholder="Enter text..." />
 *
 * // With error state
 * <Input variant="error" error="This field is required" />
 *
 * // Different sizes
 * <Input inputSize="lg" placeholder="Large input" />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      inputSize,
      error,
      id,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    const combinedDescribedBy = [ariaDescribedBy, error ? errorId : undefined]
      .filter(Boolean)
      .join(" ");

    const hasIcon = ICON_VARIANTS.has(variant ?? "");
    const isFilter = variant === "filter";

    return (
      <div className={cn("w-full", hasIcon && "relative")}>
        {hasIcon && (
          <Search
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-ui-text-tertiary",
              isFilter ? "left-2 h-3.5 w-3.5 sm:h-4 sm:w-4" : "left-3 h-4 w-4",
            )}
            aria-hidden="true"
          />
        )}
        <input
          type={type ?? (hasIcon ? "search" : undefined)}
          id={inputId}
          className={cn(
            inputVariants({ variant: error ? "error" : variant, inputSize }),
            className,
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={combinedDescribedBy || undefined}
          {...props}
        />
        {error && (
          <Typography id={errorId} variant="muted" color="error" className="mt-1 text-sm">
            {error}
          </Typography>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
