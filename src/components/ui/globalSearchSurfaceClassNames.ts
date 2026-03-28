import { cn } from "@/lib/utils";

type SearchRowIconShellTone = "default" | "muted";

export function getGlobalSearchRowIconShellClassName(options?: {
  compact?: boolean;
  tone?: SearchRowIconShellTone;
}) {
  const { compact = false, tone = "default" } = options ?? {};

  return cn(
    "flex size-9 shrink-0 items-center justify-center",
    compact ? "sm:size-7" : undefined,
    tone === "muted" ? "text-ui-text-tertiary" : undefined,
  );
}

export function getGlobalSearchIntroInsetClassName() {
  return "px-2 pt-2";
}

export function getGlobalSearchIntroPanelClassName() {
  return "p-3";
}

export function getGlobalSearchEmptyStateBodyClassName() {
  return "p-4";
}
