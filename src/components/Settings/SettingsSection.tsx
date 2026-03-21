import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, type CardProps } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import type { IconTone } from "../ui/icon-tones";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface SettingsSectionProps extends Omit<CardProps, "children"> {
  action?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  iconTone?: IconTone;
  title: string;
  titleAdornment?: ReactNode;
}

/**
 * Shared card shell for settings-tab sections with one consistent heading,
 * description, icon treatment, and optional action slot.
 */
export function SettingsSection({
  action,
  children,
  description,
  icon,
  iconTone = "brand",
  padding = "lg",
  title,
  titleAdornment,
  variant = "default",
  ...props
}: SettingsSectionProps) {
  return (
    <Card padding={padding} variant={variant} {...props}>
      <Stack gap="lg">
        <Flex direction="column" gap="md" directionMd="row" className="md:justify-between">
          <FlexItem flex="1">
            <Flex gap="sm" align="start">
              {icon ? <Icon icon={icon} size="lg" tone={iconTone} /> : null}
              <Stack gap="xs">
                <Flex gap="sm" align="center" wrap>
                  <Typography variant="h5">{title}</Typography>
                  {titleAdornment}
                </Flex>
                {description ? (
                  <Typography variant="small" color="secondary">
                    {description}
                  </Typography>
                ) : null}
              </Stack>
            </Flex>
          </FlexItem>
          {action ? <FlexItem align="start">{action}</FlexItem> : null}
        </Flex>
        {children}
      </Stack>
    </Card>
  );
}

interface SettingsSectionInsetProps extends Omit<CardProps, "children" | "title"> {
  action?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  title?: ReactNode;
}

/**
 * Shared inset block inside settings/admin surfaces so secondary groups use one
 * consistent inner shell instead of ad hoc nested cards and bordered divs.
 */
export function SettingsSectionInset({
  action,
  children,
  description,
  padding = "md",
  title,
  variant = "section",
  ...props
}: SettingsSectionInsetProps) {
  return (
    <Card padding={padding} variant={variant} {...props}>
      <Stack gap="md">
        {title || description || action ? (
          <Flex direction="column" gap="md" directionMd="row" className="md:justify-between">
            <FlexItem flex="1">
              <Stack gap="xs">
                {title ? <Typography variant="label">{title}</Typography> : null}
                {description ? (
                  <Typography variant="small" color="secondary">
                    {description}
                  </Typography>
                ) : null}
              </Stack>
            </FlexItem>
            {action ? <FlexItem align="start">{action}</FlexItem> : null}
          </Flex>
        ) : null}
        {children}
      </Stack>
    </Card>
  );
}

interface SettingsSectionRowProps {
  action?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  iconTone?: IconTone;
  title: string;
}

/**
 * Shared card shell for settings-tab sections with one consistent heading,
 * description, and optional action slot.
 */
export function SettingsSectionRow({
  action,
  description,
  icon,
  iconTone = "secondary",
  title,
}: SettingsSectionRowProps) {
  return (
    <Flex
      direction="column"
      gap="md"
      directionMd="row"
      alignMd="center"
      className="md:justify-between"
    >
      <FlexItem flex="1">
        <Flex gap="sm" align="start">
          {icon ? <Icon icon={icon} size="sm" tone={iconTone} /> : null}
          <Stack gap="xs">
            <Typography variant="label">{title}</Typography>
            {description ? (
              <Typography variant="small" color="secondary">
                {description}
              </Typography>
            ) : null}
          </Stack>
        </Flex>
      </FlexItem>
      {action ? <FlexItem align="start">{action}</FlexItem> : null}
    </Flex>
  );
}
