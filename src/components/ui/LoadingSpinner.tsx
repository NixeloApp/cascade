import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

const spinnerVariants = cva("rounded-full", {
  variants: {
    size: {
      xs: "h-3 w-3 border",
      sm: "h-4 w-4 border-2",
      md: "h-8 w-8 border-2",
      lg: "h-12 w-12 border-3",
    },
    variant: {
      brand: "border-brand border-t-transparent",
      secondary: "border-ui-text-secondary border-t-transparent",
      inherit: "border-current border-t-transparent",
    },
    animation: {
      spin: "animate-spin",
      pulse: "animate-pulse",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "secondary",
    animation: "spin",
  },
});

interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
  message?: string;
}

/**
 * Loading spinner with multiple size, color, and animation variants.
 *
 * @example
 * // Default spinner
 * <LoadingSpinner />
 *
 * // Large brand-colored spinner with message
 * <LoadingSpinner size="lg" variant="brand" message="Loading..." />
 *
 * // Subtle pulse animation
 * <LoadingSpinner animation="pulse" />
 */
export function LoadingSpinner({
  size,
  variant,
  animation,
  className,
  message,
}: LoadingSpinnerProps) {
  return (
    <Flex direction="column" align="center" justify="center" gap="md">
      <output
        className={cn(spinnerVariants({ size, variant, animation }), className)}
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </output>
      {message && (
        <Typography variant="small" className="text-ui-text-secondary">
          {message}
        </Typography>
      )}
    </Flex>
  );
}

export { spinnerVariants };

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <Flex align="center" justify="center" className="absolute inset-0 bg-ui-bg/90 z-10 rounded-lg">
      <LoadingSpinner size="lg" message={message} />
    </Flex>
  );
}
