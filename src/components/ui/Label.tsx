import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:text-ui-text-tertiary",
  {
    variants: {
      variant: {
        default: "text-ui-text",
        hint: "text-ui-text-secondary font-normal",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  /** Show required indicator (*) after the label text */
  required?: boolean;
}

/**
 * Label component with optional required indicator.
 *
 * @example
 * ```tsx
 * <Label htmlFor="email">Email</Label>
 * <Label htmlFor="name" required>Name</Label>
 * ```
 */
const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, variant, required, children, ...props }, ref) => (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ variant }), className)} {...props}>
      {children}
      {required && (
        <span aria-hidden="true" className="text-status-error ml-0.5">
          *
        </span>
      )}
    </LabelPrimitive.Root>
  ),
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
