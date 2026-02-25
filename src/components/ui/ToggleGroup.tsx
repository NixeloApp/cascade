import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const toggleGroupVariants = cva(
  "inline-flex items-center justify-center rounded-lg bg-ui-bg-soft border border-ui-border p-1",
  {
    variants: {
      size: {
        sm: "gap-0.5",
        md: "gap-1",
        lg: "gap-1.5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-ui-bg transition-[background-color,color,box-shadow] duration-default ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text data-[state=on]:bg-ui-bg data-[state=on]:text-ui-text data-[state=on]:shadow-soft",
        brand:
          "bg-transparent text-ui-text-secondary hover:bg-brand-subtle hover:text-brand-hover data-[state=on]:bg-brand data-[state=on]:text-brand-foreground data-[state=on]:shadow-soft",
        error:
          "bg-transparent text-ui-text-secondary hover:bg-status-error-bg hover:text-status-error-text data-[state=on]:bg-status-error data-[state=on]:text-brand-foreground data-[state=on]:shadow-soft",
        success:
          "bg-transparent text-ui-text-secondary hover:bg-status-success-bg hover:text-status-success-text data-[state=on]:bg-status-success data-[state=on]:text-brand-foreground data-[state=on]:shadow-soft",
        accent:
          "bg-transparent text-ui-text-secondary hover:bg-accent-subtle hover:text-accent-hover data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:shadow-soft",
        outline:
          "border border-ui-border bg-transparent hover:bg-ui-bg-hover hover:border-ui-border-secondary data-[state=on]:bg-ui-bg data-[state=on]:border-brand-ring data-[state=on]:shadow-soft",
      },
      size: {
        sm: "h-8 px-2.5 text-xs",
        md: "h-9 px-3 text-sm",
        lg: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

type ToggleGroupContextValue = VariantProps<typeof toggleGroupItemVariants>;

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  variant: "default",
  size: "md",
});

type ToggleGroupProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleGroupVariants> &
  VariantProps<typeof toggleGroupItemVariants> & {
    children?: React.ReactNode;
  };

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(toggleGroupVariants({ size, className }))}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

interface ToggleGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
    VariantProps<typeof toggleGroupItemVariants> {}

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleGroupItemVariants({
          variant: variant ?? context.variant,
          size: size ?? context.size,
        }),
        className,
      )}
      {...props}
    />
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleGroupItemVariants };
