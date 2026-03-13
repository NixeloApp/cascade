import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full border bg-ui-bg-soft text-ui-text placeholder-ui-text-tertiary transition-default focus:outline-none focus:ring-2 focus:ring-ui-border-focus focus:border-ui-border-focus hover:border-ui-border-secondary disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-md px-3 py-2.5 text-sm",
        code: "rounded-md px-3 py-2.5 text-sm font-mono tracking-tight",
        documentTitle:
          "-ml-2 rounded bg-transparent px-2 py-1 text-2xl font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-brand-ring sm:text-3xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Reusable input component with consistent styling and dark mode support
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error={errors.email}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
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
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Combine external aria-describedby with internal helper/error IDs
    const describedBy = [error ? errorId : helperText ? helperId : undefined, ariaDescribedBy]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ui-text mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            inputVariants({ variant }),
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

Input.displayName = "Input";
