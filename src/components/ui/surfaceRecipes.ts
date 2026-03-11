import { cva } from "class-variance-authority";

export const surfaceRecipeVariants = cva("border transition-default", {
  variants: {
    recipe: {
      overlayShell:
        "rounded-3xl border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg shadow-elevated",
      overlayInset:
        "rounded-2xl border-ui-border-secondary/70 bg-linear-to-b from-ui-bg-soft/80 via-ui-bg-elevated/96 to-ui-bg-secondary/84 shadow-soft",
      showcaseShell:
        "relative overflow-hidden rounded-3xl border-ui-border-secondary/75 bg-linear-to-b from-ui-bg-elevated/98 via-ui-bg-elevated to-ui-bg-secondary/78 shadow-elevated",
      showcasePanel:
        "rounded-2xl border-ui-border-secondary/70 bg-linear-to-b from-ui-bg/98 via-ui-bg-elevated/96 to-ui-bg-secondary/84 shadow-soft",
      showcasePanelQuiet:
        "rounded-2xl border-ui-border/60 bg-linear-to-b from-ui-bg-secondary/84 to-ui-bg-secondary/72 shadow-soft",
      metricTile:
        "rounded-2xl border-ui-border-secondary/70 bg-linear-to-b from-ui-bg/96 via-ui-bg-elevated/94 to-ui-bg-secondary/78 shadow-soft",
      controlRail:
        "rounded-full border-ui-border-secondary/70 bg-linear-to-r from-ui-bg-elevated/96 via-ui-bg-elevated/94 to-ui-bg-soft/90 shadow-card backdrop-blur-xl",
      controlStrip:
        "rounded-full border-ui-border-secondary/70 bg-ui-bg-elevated/94 shadow-soft backdrop-blur-sm",
      commandSection:
        "rounded-2xl border-ui-border-secondary/60 bg-linear-to-b from-ui-bg-soft/70 to-ui-bg-elevated/94 shadow-soft",
      commandIntro:
        "rounded-2xl border-ui-border/70 bg-linear-to-br from-brand-subtle/70 via-ui-bg-soft to-ui-bg-secondary/85 shadow-soft",
      keyBadge: "rounded-lg border-ui-border-secondary/70 bg-ui-bg-elevated shadow-soft",
    },
  },
});

export const modalSectionVariants = cva("", {
  variants: {
    slot: {
      header: "border-b border-ui-border-secondary/60 px-6 py-5",
      body: "min-h-0 flex-1 overflow-y-auto px-6 pb-6",
      bodyFlush: "min-h-0 flex-1 overflow-hidden",
      footer:
        "border-t border-ui-border-secondary/60 px-6 py-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end",
    },
  },
});

export const chromeButtonVariants = cva(
  "inline-flex items-center justify-center border font-medium transition-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 ring-offset-ui-bg disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      tone: {
        quiet:
          "border-transparent bg-transparent text-ui-text-secondary hover:border-ui-border/70 hover:bg-ui-bg-soft/80 hover:text-ui-text",
        framed:
          "border-ui-border-secondary/70 bg-ui-bg-elevated/94 text-ui-text-secondary shadow-soft hover:border-ui-border-secondary hover:bg-ui-bg-hover hover:text-ui-text",
        active:
          "border-ui-border-secondary/80 bg-ui-bg text-ui-text shadow-card hover:border-ui-border-secondary hover:bg-ui-bg-hover",
      },
      size: {
        icon: "h-9 w-9 rounded-full",
        pill: "h-10 rounded-full px-4 text-sm",
        compactPill: "h-8 rounded-full px-3 text-sm",
      },
    },
    defaultVariants: {
      tone: "quiet",
      size: "icon",
    },
  },
);
