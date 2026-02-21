/**
 * HTML Utilities
 *
 * Helper functions for safely generating HTML responses.
 */

/**
 * Escape characters for safe usage in HTML content.
 * Replaces &, <, >, ", ' with HTML entities.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escape JSON for safe usage in HTML <script> tags.
 * Escapes < to \u003c to prevent breaking out of the script tag.
 */
export function escapeScriptJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
