import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "./Typography";

const inputVariants = cva(
  "flex w-full rounded-lg border transition-[border-color,box-shadow] duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ui-text-tertiary focus-visible:outline-none focus-visible:border-ui-border-secondary focus-visible:shadow-soft disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-transparent text-ui-text border-ui-border",
        search: "bg-ui-bg-soft text-ui-text pl-9 border-ui-border",
        ghost: "border-transparent bg-transparent text-ui-text hover:bg-ui-bg-secondary",
        error: "border-status-error focus-visible:border-status-error",
      },
      inputSize: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Error message to display */
  error?: string;
  /** Size variant for the input */
  inputSize?: "sm" | "md" | "lg";
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

    return (
      <div className="w-full">
        <input
          type={type}
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
