/**
 * HTML Utilities
 *
 * Helper functions for safely generating HTML responses.
 */

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

/**
 * Escape JSON for safe usage in HTML <script> tags.
 * Escapes < to \u003c to prevent breaking out of the script tag.
 */
export function escapeScriptJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
