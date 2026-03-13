import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const markdownContentVariants = cva("prose max-w-none text-ui-text", {
  variants: {
    variant: {
      default: "prose-sm",
      chat: "prose-sm prose-pre:bg-ui-bg-hero prose-pre:text-ui-text-inverse prose-code:text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface MarkdownContentProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof markdownContentVariants> {}

export function MarkdownContent({ className, variant, ...props }: MarkdownContentProps) {
  return <div className={cn(markdownContentVariants({ variant }), className)} {...props} />;
}
