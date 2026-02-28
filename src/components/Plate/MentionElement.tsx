/**
 * Mention Element Components for Plate Editor
 *
 * Renders @mentions as clickable user badges in the editor.
 */

import type { PlateElementProps } from "platejs/react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface MentionValue {
  id: string;
  text: string;
  email?: string;
  image?: string;
}

interface MentionElementData {
  type: "mention";
  value?: MentionValue;
  children: Array<{ text: string }>;
}

/**
 * Renders an @mention as a user badge
 */
export function MentionElement({
  children,
  className,
  element,
  attributes,
}: PlateElementProps & { className?: string }) {
  const mentionElement = element as MentionElementData;
  const value = mentionElement.value;

  return (
    <span
      {...attributes}
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-brand-subtle px-1.5 py-0.5 align-baseline text-sm font-medium text-brand",
        "cursor-pointer hover:bg-brand-subtle/80 transition-colors",
        className,
      )}
      contentEditable={false}
    >
      {value?.image && <Avatar name={value.text} src={value.image} size="xs" />}@
      {value?.text || children}
      {children}
    </span>
  );
}
