import type * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";

/**
 * Form primitive components for building custom form layouts
 *
 * These components provide consistent styling for form elements:
 * - FormItem: Container with proper spacing
 * - FormLabel: Label with proper text hierarchy
 * - FormDescription: Helper text for additional context
 * - FormMessage: Error/validation message display
 *
 * @example
 * ```tsx
 * <FormItem>
 *   <FormLabel>Email</FormLabel>
 *   <Input type="email" />
 *   <FormDescription>We'll never share your email.</FormDescription>
 *   <FormMessage>Email is required</FormMessage>
 * </FormItem>
 * ```
 */

// ============================================================================
// FormItem - Container for form field with proper spacing
// ============================================================================

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("space-y-2", className)} {...props} />;
  },
);
FormItem.displayName = "FormItem";

// ============================================================================
// FormLabel - Label with semantic text color
// ============================================================================

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    error?: boolean;
  }
>(({ className, error, ...props }, ref) => {
  return (
    <Label
      ref={ref}
      className={cn("text-sm font-medium text-ui-text", error && "text-status-error", className)}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

// ============================================================================
// FormDescription - Helper text with secondary styling
// ============================================================================

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return <p ref={ref} className={cn("text-sm text-ui-text-secondary", className)} {...props} />;
});
FormDescription.displayName = "FormDescription";

// ============================================================================
// FormMessage - Error/validation message with status colors
// ============================================================================

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    children?: React.ReactNode;
  }
>(({ className, children, ...props }, ref) => {
  if (!children) {
    return null;
  }

  return (
    <p ref={ref} className={cn("text-sm font-medium text-status-error", className)} {...props}>
      {children}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export { FormItem, FormLabel, FormDescription, FormMessage };
