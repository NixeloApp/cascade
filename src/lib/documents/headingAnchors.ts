/**
 * Return the owned DOM anchor id used for document heading navigation targets.
 */
export function getDocumentHeadingAnchorId(headingId: string): string {
  return `document-heading-${headingId}`;
}

const documentHeadingAnchorElements = new Map<string, HTMLElement>();

export function setDocumentHeadingAnchorElement(headingId: string, element: HTMLElement | null) {
  const anchorId = getDocumentHeadingAnchorId(headingId);

  if (element) {
    documentHeadingAnchorElements.set(anchorId, element);
    return;
  }

  documentHeadingAnchorElements.delete(anchorId);
}

export function getDocumentHeadingAnchorElement(headingId: string): HTMLElement | null {
  return documentHeadingAnchorElements.get(getDocumentHeadingAnchorId(headingId)) ?? null;
}
