import type { ReactNode } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";

interface IssueDetailSectionProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  compact?: boolean;
  children: ReactNode;
}

/** Shared section anatomy for issue-detail content and sidebar surfaces. */
export function IssueDetailSection({
  title,
  description,
  eyebrow,
  action,
  compact = false,
  children,
}: IssueDetailSectionProps) {
  return (
    <section>
      <Stack gap={compact ? "sm" : "md"}>
        <Flex align="start" justify="between" gap="md">
          <FlexItem flex="1">
            <Stack gap="xs">
              {eyebrow ? <Typography variant="eyebrowWide">{eyebrow}</Typography> : null}
              <Typography variant={compact ? "h4" : "h3"}>{title}</Typography>
              {description ? (
                <Typography variant="small" color="secondary">
                  {description}
                </Typography>
              ) : null}
            </Stack>
          </FlexItem>
          {action ? <div>{action}</div> : null}
        </Flex>
        {children}
      </Stack>
    </section>
  );
}
