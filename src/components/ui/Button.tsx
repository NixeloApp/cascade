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
        brandSolid:
          "bg-brand text-brand-foreground shadow-lg shadow-brand/20 hover:bg-brand-hover focus-visible:ring-brand-ring",
        landingPrimary:
          "rounded-full bg-linear-to-r from-brand to-landing-accent px-4 py-2 text-sm font-medium whitespace-nowrap text-brand-foreground shadow-soft hover:-translate-y-px hover:bg-brand-hover hover:shadow-card sm:px-5 sm:py-2.5 focus-visible:ring-brand-ring",
        authLink:
          "text-sm font-medium text-brand-ring hover:text-brand-muted hover:underline active:scale-100 focus-visible:ring-brand-ring",
        authLinkMuted:
          "text-sm text-ui-text-tertiary hover:text-ui-text-secondary hover:underline active:scale-100 focus-visible:ring-brand-ring",
        accentGradient:
          "bg-linear-to-r from-brand to-accent text-brand-foreground shadow-sm hover:from-brand-hover hover:to-accent-hover hover:shadow-md focus-visible:ring-brand-ring",
        overlay:
          "absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring",
        assistantFab:
          "rounded-full bg-linear-to-r from-brand to-accent text-brand-foreground shadow-lg hover:scale-110 hover:shadow-xl focus-visible:ring-brand-ring",
        brandSubtle:
          "bg-brand-subtle text-brand hover:bg-brand-subtle/70 focus-visible:ring-brand-ring",
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
        workspaceIcon: "h-10 w-10 text-lg",
      },
      /** Show only on parent hover/focus-within (use inside group containers) */
      reveal: {
        true: "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100",
        responsive:
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 sm:focus:opacity-100",
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
      footerLink:
        "border-transparent bg-transparent text-ui-text-tertiary shadow-none hover:text-ui-text",
      footerSocial:
        "border-transparent bg-transparent text-ui-text-tertiary shadow-none hover:text-ui-text",
      landingBrandLink:
        "border-transparent bg-transparent text-ui-text shadow-none hover:opacity-80",
      landingNavLink:
        "border-transparent bg-transparent text-ui-text-secondary shadow-none hover:bg-ui-bg-hover hover:text-ui-text",
      landingThemeToggle:
        "border-ui-border/60 bg-ui-bg-elevated/92 text-ui-text-secondary shadow-none hover:bg-ui-bg-hover hover:text-ui-text",
      quiet:
        "border-transparent bg-transparent text-ui-text-secondary hover:border-ui-border/70 hover:bg-ui-bg-soft/80 hover:text-ui-text",
      reaction:
        "border-ui-border bg-ui-bg-soft text-ui-text-secondary shadow-none hover:border-ui-border-secondary hover:bg-ui-bg-hover",
      reactionActive:
        "border-brand-border bg-brand-subtle text-brand-subtle-foreground shadow-none hover:bg-brand-subtle/90",
      documentHeaderNeutral:
        "border-ui-border bg-transparent text-ui-text-secondary shadow-none hover:border-ui-border-secondary hover:text-ui-text",
      documentHeaderAccent:
        "border-ui-border bg-transparent text-ui-text-secondary shadow-none hover:border-brand-border hover:bg-brand-subtle hover:text-brand disabled:opacity-50",
      documentHeaderPublicActive:
        "border-status-success/30 bg-status-success-bg text-status-success-text shadow-none hover:bg-status-success-bg/80",
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
      toolbar:
        "border-transparent bg-transparent text-ui-text-secondary shadow-none hover:text-ui-text hover:bg-ui-bg-hover",
      toolbarActive:
        "border-transparent bg-brand-subtle text-brand shadow-none hover:bg-brand-subtle/90",
      listRow:
        "border-transparent bg-transparent text-ui-text shadow-none hover:bg-ui-bg-hover focus:bg-ui-bg-hover",
      listRowActive: "border-transparent bg-ui-bg-hover text-ui-text shadow-none",
      colorSwatch:
        "border-ui-border-secondary bg-transparent text-ui-text shadow-none hover:scale-110 hover:shadow-sm",
      calendarIssue:
        "border-transparent bg-transparent text-ui-text shadow-none hover:bg-ui-bg-hover focus-visible:ring-brand-ring",
      sprintPreset:
        "border-ui-border-secondary bg-ui-bg text-ui-text shadow-none hover:border-ui-border-hover",
      sprintPresetSelected: "border-brand bg-ui-bg-secondary text-ui-text shadow-none",
      roadmapResizeHandle:
        "border-transparent bg-ui-bg-elevated/50 text-ui-text-tertiary shadow-none hover:bg-ui-bg-elevated/60",
      swimlaneHeader:
        "border-transparent bg-transparent text-ui-text-secondary shadow-none hover:bg-ui-bg-hover",
      calendarHeaderControl:
        "border-ui-border bg-transparent text-ui-text shadow-none hover:border-ui-border-secondary hover:bg-ui-bg-hover",
      calendarHeaderAdd:
        "border-transparent bg-brand text-brand-foreground shadow-none hover:bg-brand-hover",
      calendarSidebarEvent:
        "border-transparent bg-transparent text-ui-text-secondary shadow-none hover:bg-ui-bg-hover hover:text-ui-text",
      calendarMonthOverflow:
        "border-transparent bg-transparent text-ui-text-tertiary shadow-none hover:text-brand",
      roadmapTimelineHitArea:
        "border-transparent bg-transparent text-ui-text shadow-none hover:bg-transparent",
      roadmapGroupRow:
        "border-ui-border bg-ui-bg-secondary/60 text-ui-text shadow-none hover:bg-ui-bg-secondary/80",
      roadmapSubtaskToggle:
        "border-transparent bg-transparent text-ui-text-tertiary shadow-none hover:text-ui-text",
      roadmapIssueKey:
        "border-transparent bg-transparent text-ui-text shadow-none hover:text-brand-hover",
      roadmapIssueKeyActive:
        "border-transparent bg-transparent text-brand-hover shadow-none hover:text-brand-hover",
      documentTreeSection:
        "border-transparent bg-transparent text-ui-text-secondary shadow-none hover:bg-ui-bg-hover",
      documentTreeSectionMuted:
        "border-transparent bg-transparent text-ui-text-tertiary shadow-none hover:bg-ui-bg-hover",
      documentTreeToggle:
        "border-transparent bg-transparent text-ui-text-tertiary shadow-none hover:bg-ui-bg-hover hover:text-ui-text",
      backdrop:
        "border-transparent bg-ui-bg-overlay text-transparent shadow-none hover:bg-ui-bg-overlay",
    },
    chromeSize: {
      footerLink: "h-auto rounded-none px-0 py-0 text-sm",
      footerSocial: "h-auto rounded-none p-0",
      landingBrandLink: "h-auto rounded-full px-0 py-0",
      landingNavPill: "h-auto rounded-full px-4 py-2 text-sm",
      landingThemeToggle: "h-9 w-9 rounded-full p-0 sm:h-10 sm:w-10",
      icon: "h-9 w-9 rounded-full",
      pill: "h-10 rounded-full px-4 text-sm",
      compactPill: "h-8 rounded-full px-3 text-sm",
      reactionPill: "h-auto rounded-full px-2 py-0.5 text-xs font-medium",
      toolbarIcon: "h-7 w-7 rounded-md p-0",
      toolbarControl: "h-7 rounded-md px-1.5 text-sm",
      listRow: "h-auto w-full justify-start rounded-none px-3 py-2 text-left text-sm",
      colorSwatch: "h-6 w-6 min-w-0 rounded p-0",
      documentHeaderAction: "min-h-0 rounded-lg px-2 py-1.5 sm:px-3",
      documentHeaderToggle: "min-h-0 rounded-lg px-2.5 py-1.5",
      filterPill:
        "h-6 rounded-full px-2 text-xs sm:h-9 sm:rounded-xl sm:border-transparent sm:bg-transparent sm:px-3 sm:text-sm",
      calendarIssue: "h-auto rounded-md px-1.5 py-1.5 text-xs",
      calendarHeaderPill: "h-6 rounded-full px-2 text-xs sm:h-7 sm:px-3",
      calendarHeaderIcon: "h-6 w-6 rounded-full p-0.5 sm:h-7 sm:w-7 sm:p-1",
      calendarHeaderAdd: "h-6 w-6 rounded-full p-0 sm:h-9 sm:w-auto sm:rounded-xl sm:px-3",
      calendarSidebarEvent: "h-auto w-full justify-start rounded-lg px-2 py-1.5 text-left text-sm",
      calendarMonthOverflow: "h-auto rounded-none p-0 text-xs font-medium",
      roadmapTimelineFill: "relative h-full w-full rounded-none p-0",
      roadmapTimelineLabel: "h-full w-full rounded-none px-2",
      roadmapResizeLeft: "absolute inset-y-0 left-0 w-2 cursor-ew-resize rounded-l-full p-0",
      roadmapResizeRight: "absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r-full p-0",
      roadmapGroupRow: "h-auto w-full rounded-none px-4 text-left",
      roadmapSubtaskToggle: "h-4 w-4 rounded-none p-0",
      roadmapIssueKey: "h-auto rounded-none p-0 text-left text-sm font-medium",
      documentTreeSection: "h-auto w-full justify-start rounded-none px-2 py-1.5 text-left",
      documentTreeToggle: "h-5 w-5 rounded-sm p-0.5",
      sprintPreset: "h-auto rounded-lg px-3 py-3 text-sm",
      swimlaneHeader: "h-auto w-full justify-start rounded-xl px-4 py-2 text-left text-sm",
      sectionToggle: "w-full justify-between min-h-0 rounded-none",
      backdrop: "fixed inset-0 h-auto w-auto rounded-none p-0",
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
