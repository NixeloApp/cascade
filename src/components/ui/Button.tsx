import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-brand-foreground hover:bg-brand-hover focus-visible:ring-brand-ring",
        secondary:
          "bg-ui-bg text-ui-text border border-ui-border hover:bg-ui-bg-secondary hover:border-ui-border-secondary focus-visible:ring-brand-ring",
        success:
          "bg-status-success text-brand-foreground hover:bg-status-success/90 focus-visible:ring-status-success",
        danger:
          "bg-status-error text-brand-foreground hover:bg-status-error/90 focus-visible:ring-status-error",
        ghost: "text-ui-text-secondary hover:bg-ui-bg-hover focus-visible:ring-brand-ring",
        link: "text-brand underline-offset-4 hover:underline active:scale-100",
        outline:
          "bg-transparent text-ui-text border border-ui-border hover:bg-ui-bg-hover hover:border-ui-border-secondary focus-visible:ring-brand-ring",
        unstyled: "focus-visible:ring-brand-ring",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Button component with multiple variants and sizes.
 *
 * @example
 * // Primary button
 * <Button>Click me</Button>
 *
 * // Secondary with icon
 * <Button variant="secondary" leftIcon={<PlusIcon />}>Add item</Button>
 *
 * // Loading state
 * <Button isLoading>Saving...</Button>
 *
 * // As child (render as link)
 * <Button asChild><a href="/home">Home</a></Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        type={asChild ? undefined : type}
        {...props}
      >
        {asChild ? (
          children
        ) : isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {size !== "icon" && children}
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
