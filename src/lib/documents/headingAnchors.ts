/**
 * Return the owned DOM anchor id used for document heading navigation targets.
 */
export function getDocumentHeadingAnchorId(headingId: string): string {
  return `document-heading-${headingId}`;
}
