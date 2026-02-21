/**
 * Escapes unsafe characters in a string for use in HTML.
 * Prevents XSS when injecting dynamic content into HTML responses.
 *
 * @param unsafe - The string to escape.
 * @returns The escaped HTML string.
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
