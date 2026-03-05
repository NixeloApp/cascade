/**
 * Shared Slack validation utilities
 */

/**
 * Check if a Slack ID (team_id or user_id) contains invalid characters.
 * Returns true if the ID is invalid (contains whitespace or control characters).
 */
export function isInvalidSlackId(value: string): boolean {
  if (value.trim() !== value || /\s/.test(value)) {
    return true;
  }
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
}
