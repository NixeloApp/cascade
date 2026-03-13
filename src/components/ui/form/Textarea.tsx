import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type TextareaHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "w-full border rounded-md px-3 py-2 text-sm resize-none bg-ui-bg text-ui-text placeholder-ui-text-tertiary transition-default focus:outline-none focus:ring-2 focus:ring-ui-border-focus focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "",
        code: "font-mono",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Reusable textarea component with consistent styling and dark mode support
 *
 * @example
 * ```tsx
 * <Textarea
 *   label="Description"
 *   rows={4}
 *   placeholder="Enter description"
 *   error={errors.description}
 * />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      id,
      variant,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    // Combine external aria-describedby with internal helper/error IDs
    const describedBy = [error ? errorId : helperText ? helperId : undefined, ariaDescribedBy]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-ui-text mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            textareaVariants({ variant }),
            error ? "border-ui-border-error" : "border-ui-border",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy || undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-status-error">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-xs text-ui-text-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
