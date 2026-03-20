import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const routeNavVariants = cva("flex max-w-full items-center overflow-x-auto scrollbar-subtle", {
  variants: {
    variant: {
      underline: "gap-6 border-b border-ui-border/70",
      pill: "gap-0.5 rounded-xl border border-ui-border-secondary/75 bg-ui-bg-elevated/94 p-0.5 shadow-soft sm:gap-1 sm:rounded-2xl sm:p-1 sm:shadow-card",
    },
    size: {
      sm: "",
      md: "",
    },
  },
  defaultVariants: {
    variant: "underline",
    size: "md",
  },
});

const routeNavItemVariants = cva(
  "inline-flex shrink-0 items-center whitespace-nowrap font-medium ring-offset-ui-bg transition-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        underline:
          "border-b-2 border-transparent text-ui-text-secondary hover:border-ui-border-secondary hover:text-ui-text aria-[current=page]:border-brand aria-[current=page]:text-ui-text",
        pill: "border border-transparent bg-ui-bg-soft/68 text-ui-text-secondary hover:border-ui-border/60 hover:bg-ui-bg-hover hover:text-ui-text aria-[current=page]:border-ui-border-secondary/70 aria-[current=page]:bg-ui-bg aria-[current=page]:text-ui-text aria-[current=page]:shadow-soft aria-[current=page]:ring-1 aria-[current=page]:ring-ui-border-secondary/70",
      },
      size: {
        sm: "",
        md: "",
      },
    },
    compoundVariants: [
      {
        variant: "underline",
        size: "sm",
        className: "px-1 py-2 text-xs",
      },
      {
        variant: "underline",
        size: "md",
        className: "px-1 py-3 text-sm",
      },
      {
        variant: "pill",
        size: "sm",
        className: "rounded-lg px-2 py-0.5 text-xs sm:rounded-xl sm:py-1",
      },
      {
        variant: "pill",
        size: "md",
        className: "rounded-xl px-3 py-2 text-sm",
      },
    ],
    defaultVariants: {
      variant: "underline",
      size: "md",
    },
  },
);

type RouteNavContextValue = VariantProps<typeof routeNavItemVariants>;

const RouteNavContext = React.createContext<RouteNavContextValue>({
  variant: "underline",
  size: "md",
});

type RouteNavProps = React.ComponentPropsWithoutRef<"nav"> &
  VariantProps<typeof routeNavVariants> & {
    children?: React.ReactNode;
  };

function RouteNav({ children, className, size, variant, ...props }: RouteNavProps) {
  return (
    <nav className={cn(routeNavVariants({ size, variant }), className)} {...props}>
      <RouteNavContext.Provider value={{ size, variant }}>{children}</RouteNavContext.Provider>
    </nav>
  );
}

interface RouteNavItemProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof routeNavItemVariants> {
  active?: boolean;
  "aria-current"?: React.AriaAttributes["aria-current"];
  asChild?: boolean;
}

const RouteNavItem = React.forwardRef<HTMLElement, RouteNavItemProps>(
  (
    { "aria-current": ariaCurrent, active, asChild = false, className, size, variant, ...props },
    ref,
  ) => {
    const context = React.useContext(RouteNavContext);
    const sharedProps = {
      "aria-current": active ? "page" : ariaCurrent,
      className: cn(
        routeNavItemVariants({
          size: size ?? context.size,
          variant: variant ?? context.variant,
        }),
        className,
      ),
      ...props,
    };

    if (asChild) {
      return <Slot ref={ref as React.Ref<HTMLElement>} {...sharedProps} />;
    }

    // Fallback to button for keyboard accessibility when not using asChild
    return <button type="button" ref={ref as React.Ref<HTMLButtonElement>} {...sharedProps} />;
  },
);
RouteNavItem.displayName = "RouteNavItem";

export { RouteNav, RouteNavItem };
