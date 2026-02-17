/**
 * Utilities for exporting data to various formats (CSV, JSON)
 */

/**
 * Sanitize a value for CSV output
 * - Escapes quotes by doubling them
 * - Wraps values containing commas, quotes, or newlines in quotes
 */
function sanitizeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If value contains special characters, wrap in quotes and escape internal quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert an array of objects to CSV format
 * @param data Array of objects to convert
 * @param columns Column definitions with key and header
 * @returns CSV string
 */
export function objectsToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
): string {
  if (data.length === 0) {
    return columns.map((c) => c.header).join(",");
  }

  // Header row
  const header = columns.map((c) => sanitizeCsvValue(c.header)).join(",");

  // Data rows
  const rows = data.map((item) => columns.map((col) => sanitizeCsvValue(item[col.key])).join(","));

  return [header, ...rows].join("\n");
}

/**
 * Download a string as a file
 * @param content File content
 * @param filename File name with extension
 * @param mimeType MIME type (defaults to text/csv)
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType = "text/csv;charset=utf-8",
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format a timestamp to ISO date string
 */
export function formatDateForExport(timestamp: number | undefined): string {
  if (!timestamp) return "";
  return new Date(timestamp).toISOString().split("T")[0];
}

/**
 * Format a timestamp to ISO datetime string
 */
export function formatDateTimeForExport(timestamp: number | undefined): string {
  if (!timestamp) return "";
  return new Date(timestamp).toISOString();
}
