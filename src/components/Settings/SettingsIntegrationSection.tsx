import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Badge, type BadgeProps } from "../ui/Badge";
import { Card } from "../ui/Card";
import type { IconTone } from "../ui/icon-tones";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { SettingsSection } from "./SettingsSection";

interface SettingsIntegrationSectionProps
  extends Omit<
    ComponentProps<typeof SettingsSection>,
    "action" | "children" | "description" | "icon" | "iconTone" | "title" | "titleAdornment"
  > {
  action?: ReactNode;
  children?: ReactNode;
  description: ReactNode;
  icon: LucideIcon;
  iconTone?: IconTone;
  status?: {
    label: ReactNode;
    variant?: BadgeProps["variant"];
  };
  summary?: ReactNode;
  title: string;
}

/**
 * Shared section shell for settings integrations so each connector keeps the
 * same heading, status, summary, and inset anatomy even when the body logic
 * differs significantly.
 */
export function SettingsIntegrationSection({
  action,
  children,
  description,
  icon,
  iconTone = "brand",
  status,
  summary,
  title,
  ...props
}: SettingsIntegrationSectionProps) {
  return (
    <SettingsSection
      title={title}
      description={description}
      icon={icon}
      iconTone={iconTone}
      action={action}
      titleAdornment={
        status ? <Badge variant={status.variant ?? "neutral"}>{status.label}</Badge> : undefined
      }
      {...props}
    >
      <Stack gap="md">
        {summary ? <SettingsIntegrationInset>{summary}</SettingsIntegrationInset> : null}
        {children}
      </Stack>
    </SettingsSection>
  );
}

interface SettingsIntegrationInsetProps {
  children: ReactNode;
}

/**
 * Inset content block used inside integration sections for connection metadata,
 * connected resources, or secondary action groups.
 */
export function SettingsIntegrationInset({ children }: SettingsIntegrationInsetProps) {
  return (
    <Card variant="section" padding="md">
      {children}
    </Card>
  );
}

interface SettingsIntegrationMetaProps {
  children: ReactNode;
  label?: ReactNode;
}

/**
 * Compact vertical metadata stack for integration summaries. Keeps status text,
 * last-sync text, and account names visually aligned across integrations.
 */
export function SettingsIntegrationMeta({ children, label }: SettingsIntegrationMetaProps) {
  return (
    <Stack gap="xs">
      {label ? (
        <Typography variant="label" color="secondary">
          {label}
        </Typography>
      ) : null}
      {children}
    </Stack>
  );
}
