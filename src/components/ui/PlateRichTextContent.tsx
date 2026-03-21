import { cva, type VariantProps } from "class-variance-authority";
import { PlateContent } from "platejs/react";
import * as React from "react";
import { cn } from "@/lib/utils";

const plateRichTextContentVariants = cva("prose prose-sm max-w-none text-ui-text", {
  variants: {
    variant: {
      documentEditor:
        "min-h-80 rounded-3xl border border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/76 px-6 py-6 leading-relaxed shadow-soft focus-visible:outline-none [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-3 [&_p]:text-base [&_p]:leading-7 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1.5 [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-ui-border-secondary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-ui-text-secondary [&_code]:rounded-md [&_code]:bg-ui-bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-ui-bg-secondary [&_pre]:p-4",
      documentEditorEmpty:
        "min-h-56 rounded-2xl border border-dashed border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-soft/58 via-ui-bg-soft/38 to-ui-bg px-5 py-5 leading-relaxed focus-visible:outline-none [&_p]:my-2.5 [&_p]:leading-7 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1",
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
