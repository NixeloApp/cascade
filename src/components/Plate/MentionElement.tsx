/**
 * Mention Element Components for Plate Editor
 *
 * Renders @mentions as clickable user badges in the editor.
 */

import type { PlateElementProps } from "platejs/react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { getMentionBadgeClassName } from "@/components/ui/badgeSurfaceClassNames";
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
    <Badge
      {...attributes}
      variant="brand"
      size="sm"
      className={cn(getMentionBadgeClassName(), className)}
      contentEditable={false}
    >
      {value?.image && <Avatar name={value.text} src={value.image} size="xs" />}@
      {value?.text || children}
    </Badge>
  );
}
