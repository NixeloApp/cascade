import { ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Breadcrumb root component - wraps the full breadcrumb navigation
 */
const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode;
  }
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    aria-label="breadcrumb"
    className={cn("flex items-center", className)}
    {...props}
  />
));
Breadcrumb.displayName = "Breadcrumb";

/**
 * BreadcrumbList - container for breadcrumb items
 */
const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn("flex flex-wrap items-center gap-1.5 break-words text-sm", className)}
      {...props}
    />
  ),
);
BreadcrumbList.displayName = "BreadcrumbList";

/**
 * BreadcrumbItem - individual breadcrumb item wrapper
 */
const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} />
  ),
);
BreadcrumbItem.displayName = "BreadcrumbItem";

/**
 * BreadcrumbLink - clickable breadcrumb link with Mintlify-inspired styling
 * Uses text-ui-text-secondary for non-active items with smooth hover transition
 */
const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean;
  }
>(({ asChild, className, ...props }, ref) => {
  return (
    <a
      ref={ref}
      className={cn(
        "text-ui-text-secondary transition-colors duration-default hover:text-ui-text",
        "max-w-40 truncate",
        className,
      )}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

/**
 * BreadcrumbPage - current/active page indicator
 * Uses text-ui-text for active state (stronger emphasis)
 */
const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      aria-current="page"
      className={cn("font-medium text-ui-text", "max-w-48 truncate", className)}
      {...props}
    />
  ),
);
BreadcrumbPage.displayName = "BreadcrumbPage";

/**
 * BreadcrumbSeparator - subtle separator between breadcrumb items
 * Uses text-ui-text-tertiary for minimal visual weight
 */
const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("text-ui-text-tertiary", className)}
    {...props}
  >
    {children ?? <ChevronRight className="h-3.5 w-3.5" />}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

/**
 * BreadcrumbEllipsis - shows truncated breadcrumb items
 */
const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-6 w-6 items-center justify-center text-ui-text-tertiary", className)}
    {...props}
  >
    <span className="text-lg leading-none">...</span>
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
