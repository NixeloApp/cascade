import { forwardRef, type InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";
import { Flex } from "../Flex";
import { Typography } from "../Typography";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Reusable checkbox component with consistent styling and dark mode support
 *
 * @example
 * ```tsx
 * <Checkbox
 *   label="Make public"
 *   checked={isPublic}
 *   onChange={(e) => setIsPublic(e.target.checked)}
 * />
 * ```
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { className, label, error, helperText, id, "aria-describedby": ariaDescribedBy, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;
    const errorId = `${checkboxId}-error`;
    const helperId = `${checkboxId}-helper`;

    // Combine external aria-describedby with internal helper/error IDs
    const describedBy = [error ? errorId : helperText ? helperId : undefined, ariaDescribedBy]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="w-full">
        <Flex align="center" gap="sm">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              "rounded border-ui-border",
              "text-brand",
              "focus:ring-2 focus:ring-ui-border-focus",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "bg-ui-bg",
              error && "border-ui-border-error",
              className,
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy || undefined}
            {...props}
          />
          {label && (
            <label htmlFor={checkboxId} className="text-sm text-ui-text cursor-pointer select-none">
              {label}
            </label>
          )}
        </Flex>
        {error && (
          <Typography variant="small" id={errorId} className="mt-1 text-status-error">
            {error}
          </Typography>
        )}
        {helperText && !error && (
          <Typography variant="muted" id={helperId} className="mt-1 text-xs">
            {helperText}
          </Typography>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
