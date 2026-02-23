import { DAY, HOUR, MINUTE } from "@convex/shared/time";

/**
 * Date and time formatting utilities
 */

/**
 * Format a timestamp as a relative time string (e.g., "2h ago", "3d ago")
 * Falls back to absolute date for older timestamps
 */
export function formatRelativeTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / MINUTE);
  const diffHours = Math.floor(diffMs / HOUR);
  const diffDays = Math.floor(diffMs / DAY);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString();
}

/**
 * Format a timestamp as a locale date string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Format a timestamp as a locale date and time string
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format a date for use in HTML date inputs (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return formatDateForInput(new Date());
}

/**
 * Format a date with custom locale options
 */
export function formatDateCustom(timestamp: number, options: Intl.DateTimeFormatOptions): string {
  return new Date(timestamp).toLocaleDateString("en-US", options);
}

/**
 * Calculate the number of days between two dates
 */
export function daysBetween(startDate: number, endDate: number): number {
  const diffMs = Math.abs(endDate - startDate);
  return Math.floor(diffMs / DAY);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if a date is in the past
 */
export function isPast(timestamp: number): boolean {
  return timestamp < Date.now();
}

/**
 * Check if a date is in the future
 */
export function isFuture(timestamp: number): boolean {
  return timestamp > Date.now();
}

/**
 * Format duration in hours to human readable format
 */
export function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours < 8) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${hours}h`;
}
