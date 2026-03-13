import { cva, type VariantProps } from "class-variance-authority";
import { PlateContent } from "platejs/react";
import * as React from "react";
import { cn } from "@/lib/utils";

const plateRichTextContentVariants = cva("prose prose-sm max-w-none text-ui-text", {
  variants: {
    variant: {
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
