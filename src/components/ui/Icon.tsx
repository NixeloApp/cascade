import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<IconSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

interface IconProps {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  /** Size preset */
  size?: IconSize;
  /** Additional className for the icon */
  className?: string;
}

/**
 * Generic icon wrapper with consistent size presets.
 *
 * @example
 * ```tsx
 * import { Bug, Calendar } from "@/lib/icons";
 *
 * <Icon icon={Bug} size="lg" />
 * <Icon icon={Calendar} size="sm" className="text-brand" />
 * ```
 */
export function Icon({ icon: IconComponent, size = "md", className }: IconProps) {
  return <IconComponent className={cn(SIZE_CLASSES[size], className)} />;
}
