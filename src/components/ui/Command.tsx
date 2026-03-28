/**
 * Command menu wrapper built on cmdk.
 *
 * The wrapper owns the search input, list sections, empty/loading states,
 * and item/group rendering so feature code never imports cmdk subcomponents.
 */

"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import * as React from "react";
import { cardRecipeVariants } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Typography } from "@/components/ui/Typography";
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
          "mx-1 cursor-pointer rounded border-transparent px-2 py-2 data-[selected=true]:border-transparent data-[selected=true]:bg-ui-bg-hover data-[selected=true]:shadow-none [&_svg]:text-ui-text-secondary",
      },
    },
    defaultVariants: {
      recipe: "default",
    },
  },
);

type CommandRecipe = VariantProps<typeof commandVariants>["recipe"];
type CommandViewport = VariantProps<typeof commandListVariants>["viewport"];
type CommandEmptyTone = VariantProps<typeof commandEmptyVariants>["tone"];
type CommandGroupRecipe = VariantProps<typeof commandGroupVariants>["recipe"];
type CommandItemRecipe = VariantProps<typeof commandItemVariants>["recipe"];

export interface CommandSearchConfig {
  ariaLabel?: string;
  className?: string;
  placeholder?: string;
  testId?: string;
  value: string;
  onValueChange: (value: string) => void;
}

export interface CommandItemConfig {
  className?: string;
  disabled?: boolean;
  keywords?: string[];
  onSelect?: (value: string) => void;
  recipe?: CommandItemRecipe;
  render: React.ReactNode;
  selected?: boolean;
  testId?: string;
  value: string;
}

export interface CommandGroupSection {
  className?: string;
  heading?: string;
  id: string;
  items: readonly CommandItemConfig[];
  recipe?: CommandGroupRecipe;
  testId?: string;
  type?: "group";
}

export interface CommandContentSection {
  className?: string;
  content: React.ReactNode;
  id: string;
  testId?: string;
  type: "content";
}

export type CommandSection = CommandContentSection | CommandGroupSection;

type CommandPrimitiveProps = Omit<
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>,
  "children"
>;

export interface CommandProps extends CommandPrimitiveProps, VariantProps<typeof commandVariants> {
  emptyMessage?: string;
  emptyTone?: CommandEmptyTone;
  footer?: React.ReactNode;
  groupRecipe?: CommandGroupRecipe;
  header?: React.ReactNode;
  itemRecipe?: CommandItemRecipe;
  listClassName?: string;
  listTestId?: string;
  loading?: boolean;
  loadingContent?: React.ReactNode;
  loadingMessage?: string;
  recipe?: CommandRecipe;
  search?: CommandSearchConfig;
  sections?: readonly CommandSection[];
  viewport?: CommandViewport;
}

interface CommandDialogProps {
  children: React.ReactNode;
  description?: string;
  onFocusOutside?: React.ComponentProps<typeof Dialog>["onFocusOutside"];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title?: string;
}

function renderSection(
  section: CommandSection,
  defaultGroupRecipe?: CommandGroupRecipe,
  defaultItemRecipe?: CommandItemRecipe,
) {
  if (section.type === "content") {
    if (!section.className && !section.testId) {
      return <React.Fragment key={section.id}>{section.content}</React.Fragment>;
    }

    return (
      <div key={section.id} className={section.className} data-testid={section.testId}>
        {section.content}
      </div>
    );
  }

  if (section.items.length === 0) {
    return null;
  }

  return (
    <CommandPrimitive.Group
      key={section.id}
      className={cn(
        cardRecipeVariants({ recipe: "commandSection" }),
        commandGroupVariants({ recipe: section.recipe ?? defaultGroupRecipe }),
        section.className,
      )}
      data-testid={section.testId}
      heading={section.heading}
    >
      {section.items.map((item) => (
        <CommandPrimitive.Item
          key={`${section.id}-${item.value}`}
          className={cn(
            commandItemVariants({ recipe: item.recipe ?? defaultItemRecipe }),
            item.className,
          )}
          data-selected={item.selected ? "true" : undefined}
          data-testid={item.testId}
          disabled={item.disabled}
          keywords={item.keywords}
          onSelect={item.onSelect}
          value={item.value}
        >
          {item.render}
        </CommandPrimitive.Item>
      ))}
    </CommandPrimitive.Group>
  );
}

export const Command = React.forwardRef<React.ElementRef<typeof CommandPrimitive>, CommandProps>(
  (
    {
      className,
      emptyMessage,
      emptyTone,
      footer,
      groupRecipe,
      header,
      itemRecipe,
      listClassName,
      listTestId,
      loading = false,
      loadingContent,
      loadingMessage = "Loading...",
      recipe,
      search,
      sections = [],
      viewport,
      ...props
    },
    ref,
  ) => (
    <CommandPrimitive ref={ref} className={cn(commandVariants({ recipe }), className)} {...props}>
      {search ? (
        <div
          className={cn(
            cardRecipeVariants({ recipe: "overlayInset" }),
            "mx-4 mt-4 flex items-center px-3",
          )}
          cmdk-input-wrapper=""
        >
          <Search className="mr-2 h-4 w-4 shrink-0 text-ui-text-tertiary" />
          <CommandPrimitive.Input
            aria-label={search.ariaLabel}
            className={cn(
              "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-ui-text-tertiary disabled:cursor-not-allowed disabled:opacity-50",
              search.className,
            )}
            data-testid={search.testId}
            placeholder={search.placeholder}
            value={search.value}
            onValueChange={search.onValueChange}
          />
        </div>
      ) : null}

      {header}

      <CommandPrimitive.List
        className={cn(commandListVariants({ viewport }), listClassName)}
        data-testid={listTestId}
      >
        {loading
          ? (loadingContent ?? (
              <div className={commandEmptyVariants({ tone: emptyTone })}>
                <Typography variant="small" color={emptyTone === "muted" ? "secondary" : undefined}>
                  {loadingMessage}
                </Typography>
              </div>
            ))
          : null}

        {!loading && emptyMessage ? (
          <CommandPrimitive.Empty className={commandEmptyVariants({ tone: emptyTone })}>
            <Typography variant="small" color={emptyTone === "muted" ? "secondary" : undefined}>
              {emptyMessage}
            </Typography>
          </CommandPrimitive.Empty>
        ) : null}

        {!loading
          ? sections.map((section) => renderSection(section, groupRecipe, itemRecipe))
          : null}
      </CommandPrimitive.List>

      {footer}
    </CommandPrimitive>
  ),
);

Command.displayName = CommandPrimitive.displayName;

/**
 * CommandDialog - command palette shell wrapped in a dialog.
 */
export function CommandDialog({
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
      <div className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-ui-text-tertiary [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-2 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
        {children}
      </div>
    </Dialog>
  );
}
