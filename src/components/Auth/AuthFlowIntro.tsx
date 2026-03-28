import type { ReactNode } from "react";
import { Icon, type IconSize, type IconTone } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import type { LucideIcon } from "@/lib/icons";

interface AuthFlowIntroProps {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  iconVariant?: "soft" | "brand" | "success" | "warning" | "error" | "muted";
  iconTone?: IconTone;
  iconSize?: IconSize;
}

/**
 * Shared icon-plus-copy intro block for verification and recovery auth states.
 */
export function AuthFlowIntro({
  icon,
  title,
  description,
  iconVariant = "brand",
  iconTone,
  iconSize = "md",
}: AuthFlowIntroProps) {
  return (
    <Stack gap="md">
      <IconCircle size="md" variant={iconVariant} tone={iconTone}>
        <Icon icon={icon} size={iconSize} />
      </IconCircle>
      <Stack gap="xs">
        <Typography variant="h4">{title}</Typography>
        {description ? (
          <Typography variant="small" color="secondary">
            {description}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}
