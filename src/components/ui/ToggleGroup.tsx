import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const toggleGroupVariants = cva(
  "inline-flex max-w-full items-center justify-center rounded-2xl p-1 shadow-soft",
  {
    variants: {
      variant: {
        default: "gap-1 border border-ui-border-secondary/70 bg-ui-bg-secondary/90",
        brand: "gap-1 border border-ui-border-secondary/70 bg-ui-bg-secondary/90",
        error: "gap-1 border border-ui-border-secondary/70 bg-ui-bg-secondary/90",
        success: "gap-1 border border-ui-border-secondary/70 bg-ui-bg-secondary/90",
        accent: "gap-1 border border-ui-border-secondary/70 bg-ui-bg-secondary/90",
        outline:
          "gap-0 overflow-hidden rounded-xl border border-ui-border-secondary/80 bg-ui-bg/95",
      },
      size: {
        sm: "",
        md: "",
        lg: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-ui-bg transition-[background-color,color,box-shadow] duration-default ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-xl bg-transparent text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text data-[state=on]:bg-ui-bg data-[state=on]:text-ui-text data-[state=on]:shadow-soft data-[state=on]:ring-1 data-[state=on]:ring-ui-border-secondary/70",
        brand:
          "rounded-xl bg-transparent text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text data-[state=on]:bg-brand data-[state=on]:text-brand-foreground data-[state=on]:shadow-soft",
        error:
          "rounded-xl bg-transparent text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text data-[state=on]:bg-status-error data-[state=on]:text-brand-foreground data-[state=on]:shadow-soft",
        success:
          "rounded-xl bg-transparent text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text data-[state=on]:bg-status-success data-[state=on]:text-brand-foreground data-[state=on]:shadow-soft",
        accent:
          "rounded-xl bg-transparent text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:shadow-soft",
        outline:
          "rounded-none border-none bg-transparent text-ui-text-secondary shadow-none hover:bg-ui-bg-hover hover:text-ui-text data-[state=on]:bg-ui-bg data-[state=on]:text-ui-text data-[state=on]:shadow-none",
      },
      size: {
        sm: "min-h-7 px-2.5 py-1 text-xs",
        md: "min-h-8 px-3 py-1.5 text-sm",
        lg: "min-h-10 px-4 py-2 text-sm",
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
    className={cn(toggleGroupVariants({ size, variant }), className)}
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
