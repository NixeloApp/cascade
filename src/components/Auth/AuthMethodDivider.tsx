import type { ReactNode } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Separator } from "@/components/ui/Separator";
import { Typography } from "@/components/ui/Typography";

interface AuthMethodDividerProps {
  label?: ReactNode;
}

/**
 * Shared divider between social sign-in and email/password auth methods.
 */
export function AuthMethodDivider({ label = "or" }: AuthMethodDividerProps) {
  return (
    <Flex align="center" gap="md">
      <FlexItem flex="1">
        <Separator />
      </FlexItem>
      <Typography variant="small" color="tertiary" as="span">
        {label}
      </Typography>
      <FlexItem flex="1">
        <Separator />
      </FlexItem>
    </Flex>
  );
}
