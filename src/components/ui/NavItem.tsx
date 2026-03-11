import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const navItemVariants = cva(
  "flex items-center gap-3 rounded-xl transition-default text-sm font-medium",
  {
    variants: {
      variant: {
        default: "",
        bordered: "",
      },
      size: {
        sm: "px-2.5 py-2",
        md: "px-3 py-2.5",
      },
      active: {
        true: "bg-ui-bg-elevated text-ui-text shadow-card ring-1 ring-inset ring-ui-border-secondary/80",
        false:
          "text-ui-text-secondary hover:bg-ui-bg-elevated/85 hover:text-ui-text hover:shadow-soft hover:ring-1 hover:ring-inset hover:ring-ui-border/60",
      },
    },
    compoundVariants: [
      {
        variant: "bordered",
        active: true,
        className: "ring-brand/20",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      active: false,
    },
  },
);

export interface NavItemProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof navItemVariants> {
  /** Render as child element (for Link components) */
  asChild?: boolean;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Collapse to icon-only mode */
  collapsed?: boolean;
}

/**
 * NavItem - Navigation item with consistent active/hover states.
 *
 * @example
 * // Basic nav item
 * <NavItem icon={<HomeIcon />}>Dashboard</NavItem>
 *
 * // Active state with border indicator
 * <NavItem active variant="bordered" icon={<HomeIcon />}>Dashboard</NavItem>
 *
 * // As a Link
 * <NavItem asChild active>
 *   <Link to="/dashboard">Dashboard</Link>
 * </NavItem>
 */
const NavItem = React.forwardRef<HTMLElement, NavItemProps>(
  (
    {
      className,
      variant,
      size,
      active,
      asChild = false,
      icon,
      collapsed = false,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "div";
    const classes = cn(
      navItemVariants({ variant, size, active }),
      collapsed && "justify-center px-2",
      collapsed && variant === "bordered" && "border-l-0",
      className,
    );

    // When asChild, pass through to child element (consumer handles icon/children)
    if (asChild) {
      return (
        <Comp
          ref={ref as React.Ref<HTMLDivElement>}
          className={classes}
          aria-current={active ? "page" : undefined}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref as React.Ref<HTMLDivElement>}
        className={classes}
        aria-current={active ? "page" : undefined}
        {...props}
      >
        {icon && <span className="shrink-0 w-5 h-5 flex items-center justify-center">{icon}</span>}
        {!collapsed && children}
      </Comp>
    );
  },
);
NavItem.displayName = "NavItem";

export { NavItem };
