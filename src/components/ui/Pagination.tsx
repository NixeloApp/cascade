import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./Button";

/* ============================================================
 * Pagination Component - Mintlify-inspired styling
 * ============================================================ */

export interface PaginationProps extends React.ComponentProps<"nav"> {
  /** Total number of pages */
  totalPages: number;
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Number of sibling pages to show on each side of current page */
  siblingCount?: number;
  /** Show first/last page buttons */
  showEdges?: boolean;
}

/**
 * Pagination component for navigating through pages.
 *
 * @example
 * <Pagination
 *   totalPages={10}
 *   currentPage={5}
 *   onPageChange={(page) => setPage(page)}
 * />
 */
export function Pagination({
  totalPages,
  currentPage,
  onPageChange,
  siblingCount = 1,
  showEdges = true,
  className,
  ...props
}: PaginationProps) {
  const pages = React.useMemo(() => {
    const range = (start: number, end: number) =>
      Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const totalPageNumbers = siblingCount * 2 + 3 + (showEdges ? 2 : 0);

    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;

    if (!showLeftDots && showRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      return [...range(1, leftItemCount), "dots-right", totalPages];
    }

    if (showLeftDots && !showRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      return [1, "dots-left", ...range(totalPages - rightItemCount + 1, totalPages)];
    }

    return [
      1,
      "dots-left",
      ...range(leftSiblingIndex, rightSiblingIndex),
      "dots-right",
      totalPages,
    ];
  }, [totalPages, currentPage, siblingCount, showEdges]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      <PaginationPrevious
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      />

      <PaginationContent>
        {pages.map((page, index) => {
          if (page === "dots-left" || page === "dots-right") {
            // biome-ignore lint/suspicious/noArrayIndexKey: needed for duplicate dot items
            return <PaginationEllipsis key={`${page}-${index}`} />;
          }

          return (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
      </PaginationContent>

      <PaginationNext
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      />
    </nav>
  );
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex items-center gap-1", className)} {...props} />;
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />;
}

export interface PaginationLinkProps extends Omit<ButtonProps, "variant" | "size"> {
  isActive?: boolean;
}

function PaginationLink({ className, isActive, children, ...props }: PaginationLinkProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-default",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2",
        isActive
          ? "bg-ui-bg-soft border border-ui-border-secondary text-ui-text"
          : "text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text",
        "disabled:pointer-events-none disabled:text-ui-text-tertiary",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function PaginationPrevious({
  className,
  disabled,
  ...props
}: Omit<ButtonProps, "variant" | "size">) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "gap-1 pl-2.5 transition-default",
        disabled && "text-ui-text-tertiary",
        className,
      )}
      disabled={disabled}
      aria-label="Go to previous page"
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </Button>
  );
}

function PaginationNext({ className, disabled, ...props }: Omit<ButtonProps, "variant" | "size">) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "gap-1 pr-2.5 transition-default",
        disabled && "text-ui-text-tertiary",
        className,
      )}
      disabled={disabled}
      aria-label="Go to next page"
      {...props}
    >
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn("flex h-9 w-9 items-center justify-center text-ui-text-tertiary", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

/* ============================================================
 * Exports
 * ============================================================ */

export {
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
