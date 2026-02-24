/**
 * Time Utilities for Convex
 *
 * Note: Date.now() is safe to use in Convex queries - it's frozen
 * at function start time, ensuring deterministic behavior.
 */

// =============================================================================
// Time Constants (milliseconds)
// =============================================================================

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY; // Approximate

// =============================================================================
// Rounding Utilities
// =============================================================================

/**
 * Round a timestamp down to the nearest interval.
 */
export function roundToInterval(timestamp: number, interval: number): number {
  return Math.floor(timestamp / interval) * interval;
}

/**
 * Round down to the start of the minute.
 */
export function roundToMinute(timestamp: number): number {
  return roundToInterval(timestamp, MINUTE);
}

/**
 * Round down to the start of the hour.
 */
export function roundToHour(timestamp: number): number {
  return roundToInterval(timestamp, HOUR);
}

/**
 * Round to the start of the day (midnight UTC).
 */
export function roundToDay(timestamp: number): number {
  return roundToInterval(timestamp, DAY);
}
