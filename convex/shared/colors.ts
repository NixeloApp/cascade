/**
 * Runtime color values shared by frontend and Convex.
 *
 * These stay as hex strings because they are stored in the database or
 * returned in API payloads independent of the CSS theme system.
 */
export const RUNTIME_COLORS = {
  /** Default label color (brand indigo) */
  DEFAULT_LABEL: "#6366F1",
  /** Neutral fallback label color when metadata is missing */
  FALLBACK_LABEL: "#6B7280",
} as const;
