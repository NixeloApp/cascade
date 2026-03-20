import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Stack, type StackProps } from "./Stack";

const listVariants = cva("", {
  variants: {
    variant: {
      plain: "list-none",
      bulleted: "list-disc list-inside text-ui-text-secondary marker:text-brand",
    },
  },
  defaultVariants: {
    variant: "plain",
  },
});

export interface ListProps extends Omit<StackProps, "as">, VariantProps<typeof listVariants> {
  as?: "ul" | "ol";
}

export function List({ as = "ul", className, variant, ...props }: ListProps) {
  return <Stack as={as} className={cn(listVariants({ variant }), className)} {...props} />;
}
