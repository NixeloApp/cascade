/**
 * Link Element for Plate Editor
 *
 * Renders inline links with hover preview and external link behavior.
 */

import type { PlateElementProps } from "platejs/react";
import { cn } from "@/lib/utils";

export function LinkElement({
  children,
  element,
  className,
  attributes,
}: PlateElementProps & { className?: string }) {
  const rawUrl = (element as { url?: string }).url || "#";
  // Sanitize: only allow http(s) and mailto protocols
  const url = /^(https?:|mailto:)/i.test(rawUrl) ? rawUrl : "#";

  return (
    <a
      {...attributes}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-brand underline decoration-brand/30 underline-offset-2 cursor-pointer",
        className,
      )}
      title={url}
    >
      {children}
    </a>
  );
}
