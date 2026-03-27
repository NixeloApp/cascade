import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container, type ContainerProps, type ContainerSize } from "../ui/Container";

type MaxWidth = ContainerSize;

interface PageLayoutProps extends Omit<ContainerProps, "children" | "padding" | "size"> {
  children: ReactNode;
  maxWidth?: MaxWidth;
  fullHeight?: boolean;
}

/** Standard page layout container with max-width and padding. */
export function PageLayout({
  children,
  className,
  maxWidth = "full",
  fullHeight = false,
  ...props
}: PageLayoutProps): ReactNode {
  return (
    <Container
      size={maxWidth}
      padding="page"
      className={cn("w-full", fullHeight && "h-full overflow-y-auto", className)}
      style={{ animation: "var(--animation-fade-in)" }}
      {...props}
    >
      {children}
    </Container>
  );
}
