/**
 * Command Palette
 *
 * Command menu component built on cmdk library.
 * Provides search input, item groups, and keyboard navigation.
 * Used in global search and command dialogs.
 */

"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import * as React from "react";
import { cardRecipeVariants } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

const commandVariants = cva("flex h-full w-full flex-col overflow-hidden text-ui-text", {
  variants: {
    recipe: {
      default: "bg-transparent",
      palette: "bg-ui-bg",
      suggestionMenu: "rounded-lg border border-ui-border bg-ui-bg-elevated shadow-elevated",
    },
  },
  defaultVariants: {
    recipe: "default",
  },
});

type CommandProps = React.ComponentProps<typeof CommandPrimitive> &
  VariantProps<typeof commandVariants>;

const Command = ({ className, recipe, ...props }: CommandProps) => (
  <CommandPrimitive className={cn(commandVariants({ recipe }), className)} {...props} />
);
Command.displayName = CommandPrimitive.displayName;

const commandListVariants = cva("min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-3", {
  variants: {
    viewport: {
      default: "",
      palette: "max-h-[50vh] sm:max-h-[60vh]",
      slashMenu: "max-h-80 scrollbar-subtle",
    },
  },
  defaultVariants: {
    viewport: "default",
  },
});

const commandEmptyVariants = cva("py-6 text-center text-sm", {
  variants: {
    tone: {
      default: "text-ui-text",
      muted: "text-ui-text-secondary",
    },
  },
  defaultVariants: {
    tone: "default",
  },
});

const commandGroupVariants = cva("overflow-hidden p-1 text-ui-text", {
  variants: {
    recipe: {
      default: "",
      palette: "[&_[cmdk-group-heading]]:text-ui-text-tertiary",
      slashMenu:
        "px-1 py-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ui-text-tertiary",
    },
  },
  defaultVariants: {
    recipe: "default",
  },
});

const commandItemVariants = cva(
  "relative flex cursor-default gap-2 select-none items-center rounded-xl border border-transparent px-2 py-1.5 text-sm outline-none transition-all data-[disabled=true]:pointer-events-none data-[selected=true]:border-ui-border-secondary/70 data-[selected=true]:bg-ui-bg-elevated data-[selected=true]:text-ui-text data-[selected=true]:shadow-card data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      recipe: {
        default: "",
        palette: "cursor-pointer data-[selected=true]:bg-brand-subtle",
        slashMenu:
          "mx-1 rounded border-transparent px-2 py-2 cursor-pointer data-[selected=true]:border-transparent data-[selected=true]:bg-ui-bg-hover data-[selected=true]:shadow-none [&_svg]:text-ui-text-secondary",
      },
    },
    defaultVariants: {
      recipe: "default",
    },
  },
);

interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  onFocusOutside?: React.ComponentProps<typeof Dialog>["onFocusOutside"];
}

/**
 * CommandDialog - Command palette wrapped in a dialog.
 */
function CommandDialog({
  open,
  onOpenChange,
  children,
  title = "Search",
  description = "Search for issues, documents, and more",
  onFocusOutside,
}: CommandDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      recipe="command"
      title={title}
      description={description}
      onFocusOutside={onFocusOutside}
    >
      <Command className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-ui-text-tertiary [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-2 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
        {children}
      </Command>
    </Dialog>
  );
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      cardRecipeVariants({ recipe: "overlayInset" }),
      "mx-4 mt-4 flex items-center px-3",
    )}
    cmdk-input-wrapper=""
  >
    <Search className="mr-2 h-4 w-4 shrink-0 text-ui-text-tertiary" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-ui-text-tertiary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> &
    VariantProps<typeof commandListVariants>
>(({ className, viewport, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(commandListVariants({ viewport }), className)}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> &
    VariantProps<typeof commandEmptyVariants>
>(({ className, tone, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn(commandEmptyVariants({ tone }), className)}
    {...props}
  />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> &
    VariantProps<typeof commandGroupVariants>
>(({ className, recipe, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      cardRecipeVariants({ recipe: "commandSection" }),
      commandGroupVariants({ recipe }),
      className,
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-ui-border", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> &
    VariantProps<typeof commandItemVariants>
>(({ className, recipe, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(commandItemVariants({ recipe }), className)}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-ui-text-tertiary", className)}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
