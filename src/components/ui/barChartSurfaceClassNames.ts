import { cn } from "@/lib/utils";

export const BAR_CHART_TONES = ["accent", "brand", "info", "success", "warning"] as const;

export type BarChartTone = (typeof BAR_CHART_TONES)[number];

const BAR_CHART_TONE_CLASS_NAMES: Record<BarChartTone, string> = {
  accent: "bg-accent",
  brand: "bg-brand",
  info: "bg-status-info",
  success: "bg-status-success",
  warning: "bg-status-warning",
};

export function getBarChartTrackClassName() {
  return "relative h-6 rounded-full bg-ui-bg-tertiary";
}

export function getBarChartFillClassName(tone: BarChartTone) {
  return cn(BAR_CHART_TONE_CLASS_NAMES[tone], "h-6 rounded-full pr-2 transition-all duration-slow");
}
