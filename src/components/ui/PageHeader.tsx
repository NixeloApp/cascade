import * as React from "react";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * Consistent page header with title, optional description, and action buttons.
 *
 * @example
 * <PageHeader
 *   title="Projects"
 *   description="Manage your team projects"
 *   actions={<Button>Create Project</Button>}
 * />
 */
export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, actions, ...props }, ref) => (
    <Flex
      ref={ref}
      justify="between"
      align="start"
      gap="md"
      className={cn("mb-6", className)}
      {...props}
    >
      <div className="space-y-1">
        <Typography variant="h2">{title}</Typography>
        {description && <Typography variant="muted">{description}</Typography>}
      </div>
      {actions && (
        <Flex gap="sm" align="center" className="shrink-0">
          {actions}
        </Flex>
      )}
    </Flex>
  ),
);
PageHeader.displayName = "PageHeader";
