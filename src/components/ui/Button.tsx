/**
 * Button Component
 *
 * Primary interactive element with multiple variants.
 * Supports loading states, icons, and polymorphic rendering.
 * Use asChild prop to render as a different element.
 */

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
          "bg-linear-to-r from-landing-accent to-landing-accent-teal text-brand-foreground shadow-sm hover:shadow-md hover:brightness-105 focus-visible:ring-brand-ring",
        accentGradient:
          "bg-linear-to-r from-brand to-accent text-brand-foreground shadow-sm hover:from-brand-hover hover:to-accent-hover hover:shadow-md focus-visible:ring-brand-ring",
        assistantFab:
          "rounded-full bg-linear-to-r from-brand to-accent text-brand-foreground shadow-lg hover:scale-110 hover:shadow-xl focus-visible:ring-brand-ring",
        secondary:
          "bg-ui-bg text-ui-text border border-ui-border shadow-soft hover:bg-ui-bg-secondary hover:border-ui-border-secondary focus-visible:ring-brand-ring",
        success:
          "bg-status-success text-brand-foreground hover:bg-status-success/90 focus-visible:ring-status-success",
        danger:
          "bg-status-error text-brand-foreground hover:bg-status-error/90 focus-visible:ring-status-error",
        ghostDanger: "text-status-error hover:bg-status-error-bg focus-visible:ring-status-error",
        ghost: "text-ui-text-secondary hover:bg-ui-bg-hover focus-visible:ring-brand-ring",
        link: "text-brand underline-offset-4 hover:underline active:scale-100",
        outline:
          "bg-transparent text-ui-text border border-ui-border hover:bg-ui-bg-hover hover:border-ui-border-secondary focus-visible:ring-brand-ring",
        unstyled: "focus-visible:ring-brand-ring",
      },
      size: {
        none: "",
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
      },
      /** Show only on parent hover/focus-within (use inside group containers) */
      reveal: {
        true: "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      reveal: false,
    },
  },
);

const buttonChromeVariants = cva("border ring-offset-ui-bg focus-visible:ring-brand-ring", {
  variants: {
    chrome: {
      quiet:
        "border-transparent bg-transparent text-ui-text-secondary hover:border-ui-border/70 hover:bg-ui-bg-soft/80 hover:text-ui-text",
      timerStrip:
        "border-transparent bg-transparent text-brand-indigo-text hover:bg-brand-indigo-bg/10 hover:text-brand-indigo-text",
      framed:
        "border-ui-border-secondary/70 bg-ui-bg-elevated/94 text-ui-text-secondary shadow-soft hover:border-ui-border-secondary hover:bg-ui-bg-hover hover:text-ui-text",
      active:
        "border-ui-border-secondary/80 bg-ui-bg text-ui-text shadow-card hover:border-ui-border-secondary hover:bg-ui-bg-hover",
      filter:
        "border-ui-border/45 bg-transparent text-ui-text-secondary shadow-none hover:border-ui-border/60 hover:bg-ui-bg-hover/72 sm:border-ui-border/55 sm:bg-ui-bg-elevated/86 sm:hover:bg-ui-bg-hover/80",
      filterActive:
        "border-brand/15 bg-brand-subtle/78 text-brand shadow-none hover:bg-brand-subtle sm:border-brand/10 sm:bg-brand-subtle",
    },
    chromeSize: {
      icon: "h-9 w-9 rounded-full",
      pill: "h-10 rounded-full px-4 text-sm",
      compactPill: "h-8 rounded-full px-3 text-sm",
      filterPill:
        "h-6 rounded-full px-2 text-xs sm:h-9 sm:rounded-xl sm:border-transparent sm:bg-transparent sm:px-3 sm:text-sm",
    },
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  chrome?: VariantProps<typeof buttonChromeVariants>["chrome"];
  chromeSize?: VariantProps<typeof buttonChromeVariants>["chromeSize"];
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
      reveal,
      chrome,
      chromeSize,
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
    const resolvedVariant = chrome ? "unstyled" : variant;
    const resolvedSize = chromeSize ? "none" : size;
    const isIconButton = chromeSize === "icon" || size === "icon";

    return (
      <Comp
        className={cn(
          buttonVariants({ variant: resolvedVariant, size: resolvedSize, reveal }),
          (chrome || chromeSize) && buttonChromeVariants({ chrome, chromeSize }),
          className,
        )}
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
            {!isIconButton ? children : <span className="sr-only">{children}</span>}
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

export { Button, buttonVariants, buttonChromeVariants };
