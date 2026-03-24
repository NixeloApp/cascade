/**
 * Stack Component
 *
 * Vertical flex container with gap and alignment props.
 * Semantic alternative to raw flex divs.
 * Use for consistent vertical spacing between elements.
 */

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const stackVariants = cva("flex flex-col", {
  variants: {
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
      xl: "gap-6",
      "2xl": "gap-8",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
    mb: {
      none: "",
      xs: "mb-1",
      sm: "mb-2",
      md: "mb-4",
      lg: "mb-6",
      xl: "mb-8",
    },
    pt: {
      none: "",
      xs: "pt-1",
      sm: "pt-2",
      md: "pt-4",
      lg: "pt-5",
      xl: "pt-8",
    },
    mt: {
      none: "",
      xs: "mt-1",
      sm: "mt-2",
      md: "mt-4",
      lg: "mt-6",
      xl: "mt-8",
    },
  },
  defaultVariants: {
    gap: "md",
    align: "stretch",
  },
});

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {
  as?: React.ElementType;
}

/**
 * Vertical flex layout with consistent gap spacing.
 * Replaces `<div className="space-y-*">` and `<Flex direction="column">`.
 *
 * @example
 * <Stack gap="lg">
 *   <Card>First</Card>
 *   <Card>Second</Card>
 * </Stack>
 */
export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap, align, mb, mt, pt, as: Component = "div", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(stackVariants({ gap, align, mb, mt, pt }), className)}
      {...props}
    />
  ),
);
Stack.displayName = "Stack";

export { stackVariants };
