/**
 * Utility Functions
 *
 * Core utility functions used across the application.
 * Includes the cn() function for Tailwind class merging.
 * Combines clsx and tailwind-merge for intelligent class handling.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind CSS class names with clsx and tailwind-merge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
