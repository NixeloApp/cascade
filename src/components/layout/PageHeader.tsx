import { Link } from "@tanstack/react-router";
import React, { type ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/Breadcrumb";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { PageTitleText, Typography } from "@/components/ui/Typography";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";

interface BreadcrumbData {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbData[];
  eyebrow?: string;
  descriptionTestId?: string;
  className?: string;
  spacing?: "standalone" | "stack";
}

/** Page header with title, breadcrumbs, and action buttons. */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  eyebrow,
  descriptionTestId,
  className,
  spacing = "standalone",
}: PageHeaderProps): ReactNode {
  return (
    <header className={cn(spacing === "standalone" && "mb-4 sm:mb-5", className)}>
      <Stack gap="sm">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb.label}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.to ? (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.to}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <Flex
          justify="between"
          align="start"
          alignSm="end"
          gap="md"
          direction="column"
          directionSm="row"
        >
          <Stack gap="xs" className="min-w-0">
            {eyebrow ? <Typography variant="eyebrowWide">{eyebrow}</Typography> : null}
            <PageTitleText as="h2" data-testid={TEST_IDS.PAGE.HEADER_TITLE}>
              {title}
            </PageTitleText>
            {description ? (
              <Typography
                variant="small"
                color="tertiary"
                className="max-w-3xl leading-5"
                data-testid={descriptionTestId}
              >
                {description}
              </Typography>
            ) : null}
          </Stack>
          {actions && (
            <Flex gap="sm" align="center" wrap className="w-full shrink-0 sm:w-auto sm:justify-end">
              {actions}
            </Flex>
          )}
        </Flex>
      </Stack>
    </header>
  );
}
