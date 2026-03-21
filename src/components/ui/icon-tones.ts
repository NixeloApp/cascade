const iconToneClasses = {
  default: "",
  secondary: "text-ui-text-secondary",
  tertiary: "text-ui-text-tertiary",
  brand: "text-brand",
  brandActive: "text-brand-active",
  brandForeground: "text-brand-foreground",
  success: "text-status-success",
  successText: "text-status-success-text",
  warning: "text-status-warning",
  warningText: "text-status-warning-text",
  error: "text-status-error",
  errorText: "text-status-error-text",
  info: "text-status-info",
  infoText: "text-status-info-text",
  accent: "text-accent",
} as const;

type IconTone = keyof typeof iconToneClasses;

export { iconToneClasses };
export type { IconTone };
