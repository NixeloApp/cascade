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
  /** Shared runtime info/primary blue for seeded data and outbound payloads */
  INFO: "#3B82F6",
  /** Shared runtime success green for seeded data and outbound payloads */
  SUCCESS: "#10B981",
  /** Shared runtime warning amber for seeded data and outbound payloads */
  WARNING: "#F59E0B",
  /** Shared runtime danger red for seeded data and outbound payloads */
  DANGER: "#EF4444",
  /** Shared runtime accent purple for seeded data and outbound payloads */
  ACCENT: "#8B5CF6",
  /** Shared runtime muted text gray for outbound HTML payloads */
  MUTED_TEXT: "#666666",
} as const;

/** Theme-aligned preset swatches used by the generic color picker. */
export const COLOR_PICKER_PRESET_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
  "#14B8A6",
] as const;

/** Named text color options used by the Plate editor toolbar. */
export const EDITOR_TEXT_COLOR_OPTIONS = [
  { name: "Default", value: "" },
  { name: "Gray", value: "#6b7280" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Amber", value: "#d97706" },
  { name: "Green", value: "#16a34a" },
  { name: "Teal", value: "#0d9488" },
  { name: "Blue", value: "#2563eb" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Purple", value: "#9333ea" },
  { name: "Pink", value: "#db2777" },
] as const;

/** Named highlight color options used by the Plate editor toolbar. */
export const EDITOR_HIGHLIGHT_COLOR_OPTIONS = [
  { name: "None", value: "" },
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Purple", value: "#e9d5ff" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Orange", value: "#fed7aa" },
  { name: "Red", value: "#fecaca" },
  { name: "Gray", value: "#e5e7eb" },
] as const;

/** Collaboration cursor colors for awareness/presence features. */
export const YJS_CURSOR_COLORS = [
  { main: "#F44336", light: "rgba(244, 67, 54, 0.2)" },
  { main: "#E91E63", light: "rgba(233, 30, 99, 0.2)" },
  { main: "#9C27B0", light: "rgba(156, 39, 176, 0.2)" },
  { main: "#673AB7", light: "rgba(103, 58, 183, 0.2)" },
  { main: "#3F51B5", light: "rgba(63, 81, 181, 0.2)" },
  { main: "#2196F3", light: "rgba(33, 150, 243, 0.2)" },
  { main: "#00BCD4", light: "rgba(0, 188, 212, 0.2)" },
  { main: "#009688", light: "rgba(0, 150, 136, 0.2)" },
  { main: "#4CAF50", light: "rgba(76, 175, 80, 0.2)" },
  { main: "#FF9800", light: "rgba(255, 152, 0, 0.2)" },
] as const;
