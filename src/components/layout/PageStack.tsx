import * as React from "react";
import { Stack, type StackProps } from "../ui/Stack";

/**
 * Shared vertical rhythm for top-level page sections.
 * Owns the spacing between headers, controls bands, and the first content surface.
 */
export const PageStack = React.forwardRef<HTMLDivElement, Omit<StackProps, "gap">>(
  ({ children, ...props }, ref) => {
    return (
      <Stack ref={ref} gap="xl" {...props}>
        {children}
      </Stack>
    );
  },
);

PageStack.displayName = "PageStack";
