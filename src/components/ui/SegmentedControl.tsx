import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const segmentedControlVariants = cva(
  "inline-flex max-w-full items-center justify-start overflow-x-auto scrollbar-subtle",
  {
    variants: {
      variant: {
        default:
          "gap-1 rounded-2xl border border-ui-border-secondary/70 bg-ui-bg-secondary/90 p-1 shadow-soft",
        outline:
          "gap-0 overflow-hidden rounded-xl border border-ui-border-secondary/80 bg-ui-bg/95 shadow-soft",
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

const segmentedControlItemVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-ui-bg transition-[background-color,color,box-shadow,border-color] duration-default ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-xl bg-transparent text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text data-[state=on]:bg-ui-bg data-[state=on]:text-ui-text data-[state=on]:shadow-soft data-[state=on]:ring-1 data-[state=on]:ring-ui-border-secondary/70",
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

type SegmentedControlContextValue = VariantProps<typeof segmentedControlItemVariants>;

const SegmentedControlContext = React.createContext<SegmentedControlContextValue>({
  variant: "default",
  size: "md",
});

type SegmentedControlProps = Omit<
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>,
  "defaultValue" | "onValueChange" | "type" | "value"
> &
  VariantProps<typeof segmentedControlVariants> &
  VariantProps<typeof segmentedControlItemVariants> & {
    children?: React.ReactNode;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    value?: string;
  };

const SegmentedControl = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  SegmentedControlProps
>(({ className, children, size, variant, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    type="single"
    className={cn(segmentedControlVariants({ size, variant }), className)}
    {...props}
  >
    <SegmentedControlContext.Provider value={{ size, variant }}>
      {children}
    </SegmentedControlContext.Provider>
  </ToggleGroupPrimitive.Root>
));
SegmentedControl.displayName = "SegmentedControl";

interface SegmentedControlItemProps
  extends React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
    VariantProps<typeof segmentedControlItemVariants> {}

const SegmentedControlItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  SegmentedControlItemProps
>(({ className, size, variant, ...props }, ref) => {
  const context = React.useContext(SegmentedControlContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        segmentedControlItemVariants({
          size: size ?? context.size,
          variant: variant ?? context.variant,
        }),
        className,
      )}
      {...props}
    />
  );
});
SegmentedControlItem.displayName = "SegmentedControlItem";

export { SegmentedControl, SegmentedControlItem };
