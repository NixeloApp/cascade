import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container, type ContainerSize } from "../ui/Container";

type MaxWidth = ContainerSize;

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  maxWidth?: MaxWidth;
  fullHeight?: boolean;
}

/** Standard page layout container with max-width and padding. */
export function PageLayout({
  children,
  className,
  maxWidth = "full",
  fullHeight = false,
}: PageLayoutProps): ReactNode {
  return (
    <Container
      size={maxWidth}
      padding="page"
      className={cn("w-full", fullHeight && "h-full overflow-y-auto", className)}
      style={{ animation: "var(--animation-fade-in)" }}
    >
      {children}
    </Container>
  );
}
