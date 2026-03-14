import { cva, type VariantProps } from "class-variance-authority";
import { PlateContent } from "platejs/react";
import * as React from "react";
import { cn } from "@/lib/utils";

const plateRichTextContentVariants = cva("prose prose-sm max-w-none text-ui-text", {
  variants: {
    variant: {
      documentEditor:
        "min-h-80 rounded-3xl border border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/76 px-6 py-6 leading-relaxed shadow-soft focus-visible:outline-none",
      documentEditorEmpty:
        "min-h-56 rounded-2xl border border-dashed border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-soft/58 via-ui-bg-soft/38 to-ui-bg px-5 py-5 leading-relaxed focus-visible:outline-none",
      issueEditor:
        "p-3 leading-relaxed focus-visible:outline-none [&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_pre]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-ui-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-ui-text-secondary [&_code]:rounded [&_code]:bg-ui-bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-ui-bg-secondary [&_pre]:p-3",
      issueReadOnly:
        "leading-relaxed [&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_pre]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-ui-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-ui-text-secondary [&_code]:rounded [&_code]:bg-ui-bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-ui-bg-secondary [&_pre]:p-3",
    },
  },
  defaultVariants: {
    variant: "issueEditor",
  },
});

type PlateRichTextContentProps = React.ComponentPropsWithoutRef<typeof PlateContent> &
  VariantProps<typeof plateRichTextContentVariants>;

export const PlateRichTextContent = React.forwardRef<
  React.ElementRef<typeof PlateContent>,
  PlateRichTextContentProps
>(({ className, variant, ...props }, ref) => (
  <PlateContent
    ref={ref}
    className={cn(plateRichTextContentVariants({ variant }), className)}
    {...props}
  />
));

PlateRichTextContent.displayName = "PlateRichTextContent";
