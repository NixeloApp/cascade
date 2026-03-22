import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const overlaySectionVariants = cva("", {
  variants: {
    surface: {
      modal: "",
      popover: "",
      dropdown: "",
    },
    density: {
      default: "",
      compact: "",
    },
    slot: {
      header: "",
      body: "",
      footer: "",
    },
  },
  compoundVariants: [
    {
      surface: "modal",
      slot: "header",
      className: "border-b border-ui-border-secondary/60 px-4 py-4 pr-10 text-left sm:px-6 sm:py-5",
    },
    {
      surface: "modal",
      slot: "body",
      className: "min-h-0 flex-1 overflow-y-auto",
    },
    {
      surface: "modal",
      slot: "footer",
      className:
        "border-t border-ui-border-secondary/60 px-4 py-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:px-6",
    },
    {
      surface: "popover",
      slot: "header",
      className: "border-b border-ui-border-secondary/60",
    },
    {
      surface: "popover",
      density: "default",
      slot: "header",
      className: "px-4 py-3.5",
    },
    {
      surface: "popover",
      density: "compact",
      slot: "header",
      className: "px-4 py-2.5",
    },
    {
      surface: "popover",
      slot: "body",
      className: "px-4 py-3.5",
    },
    {
      surface: "popover",
      slot: "footer",
      className:
        "border-t border-ui-border-secondary/60 px-4 py-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
    },
    {
      surface: "dropdown",
      slot: "header",
      className: "border-b border-ui-border-secondary/60 px-3 py-2.5",
    },
    {
      surface: "dropdown",
      slot: "body",
      className: "px-1 py-1",
    },
    {
      surface: "dropdown",
      slot: "footer",
      className: "border-t border-ui-border-secondary/60 px-1 py-1.5",
    },
  ],
  defaultVariants: {
    density: "default",
    surface: "popover",
  },
});

const overlayTitleVariants = cva("", {
  variants: {
    surface: {
      modal: "text-xl leading-none font-semibold tracking-tight text-ui-text",
      popover: "text-sm font-semibold leading-none text-ui-text",
      dropdown: "text-xs font-semibold uppercase tracking-wide text-ui-text-secondary",
    },
  },
  defaultVariants: {
    surface: "popover",
  },
});

const overlayDescriptionVariants = cva("", {
  variants: {
    surface: {
      modal: "max-w-2xl text-sm leading-6 text-ui-text-secondary",
      popover: "text-sm leading-6 text-ui-text-secondary",
      dropdown: "text-xs leading-5 text-ui-text-tertiary",
    },
  },
  defaultVariants: {
    surface: "popover",
  },
});

type OverlaySurface = NonNullable<VariantProps<typeof overlaySectionVariants>["surface"]>;
type OverlayTextTag = "div" | "h2" | "h3" | "h4" | "p" | "span";

interface OverlaySectionProps extends React.HTMLAttributes<HTMLDivElement> {
  density?: NonNullable<VariantProps<typeof overlaySectionVariants>["density"]>;
  surface?: OverlaySurface;
}

interface OverlayTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: OverlayTextTag;
  surface?: OverlaySurface;
}

const overlayDismissButtonClassName =
  "absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-full border border-ui-border-secondary/70 bg-ui-bg-elevated/90 text-ui-text-secondary shadow-soft transition-all hover:border-ui-border-secondary hover:bg-ui-bg-soft hover:text-ui-text focus:outline-none focus:ring-2 focus:ring-brand-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

function OverlayHeader({ className, density, surface = "popover", ...props }: OverlaySectionProps) {
  return (
    <div
      className={cn(overlaySectionVariants({ density, surface, slot: "header" }), className)}
      {...props}
    />
  );
}

function OverlayBody({ className, surface = "popover", ...props }: OverlaySectionProps) {
  return (
    <div className={cn(overlaySectionVariants({ surface, slot: "body" }), className)} {...props} />
  );
}

function OverlayFooter({ className, surface = "popover", ...props }: OverlaySectionProps) {
  return (
    <div
      className={cn(overlaySectionVariants({ surface, slot: "footer" }), className)}
      {...props}
    />
  );
}

function OverlayTitle({ as = "h3", className, surface = "popover", ...props }: OverlayTextProps) {
  const Component = as;
  return <Component className={cn(overlayTitleVariants({ surface }), className)} {...props} />;
}

function OverlayDescription({
  as = "p",
  className,
  surface = "popover",
  ...props
}: OverlayTextProps) {
  const Component = as;
  return (
    <Component className={cn(overlayDescriptionVariants({ surface }), className)} {...props} />
  );
}

export type { OverlaySurface };
export {
  OverlayBody,
  OverlayDescription,
  OverlayFooter,
  OverlayHeader,
  OverlayTitle,
  overlayDescriptionVariants,
  overlayDismissButtonClassName,
  overlaySectionVariants,
  overlayTitleVariants,
};
