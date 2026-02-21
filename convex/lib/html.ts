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
 * Escapes <, >, and / to prevent breaking out of the script tag
 * and for defense-in-depth against legacy comment terminators.
 */
export function escapeScriptJson(data: unknown): string {
  const json = JSON.stringify(data) ?? "null";
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\//g, "\\u002f");
}
