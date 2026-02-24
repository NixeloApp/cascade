import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const navItemVariants = cva(
  "flex items-center gap-3 rounded-md transition-default text-sm font-medium",
  {
    variants: {
      variant: {
        default: "",
        bordered: "",
      },
      size: {
        sm: "px-2 py-1.5",
        md: "px-3 py-2",
      },
      active: {
        true: "bg-ui-bg-hover text-ui-text",
        false: "text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text",
      },
    },
    compoundVariants: [
      {
        variant: "bordered",
        active: true,
        className: "border-l-2 border-brand",
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

    return (
      <Comp
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          navItemVariants({ variant, size, active }),
          collapsed && "justify-center px-2",
          collapsed && variant === "bordered" && "border-l-0",
          className,
        )}
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

export { NavItem, navItemVariants };
