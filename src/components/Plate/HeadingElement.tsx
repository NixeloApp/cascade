import type { PlateElementProps } from "platejs/react";
import {
  getDocumentHeadingAnchorId,
  setDocumentHeadingAnchorElement,
} from "@/lib/documents/headingAnchors";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";

interface HeadingElementData {
  id?: string;
  type?: string;
}

const headingTagByType = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
} as const;

type HeadingTag = keyof typeof headingTagByType;

function isHeadingTag(value: string | undefined): value is HeadingTag {
  return value !== undefined && value in headingTagByType;
}

/**
 * Render Plate heading nodes with the shared document heading anchor contract.
 */
export function HeadingElement({
  children,
  element,
  className,
  attributes,
}: PlateElementProps & { className?: string }) {
  const headingElement = element as HeadingElementData;
  const Tag = headingTagByType[isHeadingTag(headingElement.type) ? headingElement.type : "h1"];
  const headingId = headingElement.id?.trim() ? headingElement.id.trim() : undefined;

  return (
    <Tag
      {...attributes}
      id={headingId ? getDocumentHeadingAnchorId(headingId) : undefined}
      ref={(node: HTMLElement | null) => {
        if (!headingId) {
          return;
        }

        setDocumentHeadingAnchorElement(headingId, node);
      }}
      data-testid={headingId ? TEST_IDS.DOCUMENT.HEADING_ANCHOR : undefined}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
