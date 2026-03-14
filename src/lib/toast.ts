/**
 * Toast notification utilities for consistent error and success messaging
 */

import { toast } from "sonner";

/**
 * Extract error message from an unknown error object
 */
export function getErrorMessage(error: unknown, fallback = "An error occurred"): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return fallback;
}

/**
 * Show a success toast notification
 */
export function showSuccess(message: string): void {
  toast.success(message);
}

/**
 * Show an info toast notification
 */
export function showInfo(message: string): void {
  toast.info(message);
}

/**
 * Show an error toast notification with automatic error message extraction
 */
export function showError(error: unknown, fallback = "An error occurred"): void {
  const message = getErrorMessage(error, fallback);
  toast.error(message);
}

/**
 * Show a success toast for create operations
 */
export function showCreated(entity: string): void {
  toast.success(`${entity} created successfully`);
}

/**
 * Show a success toast for update operations
 */
export function showUpdated(entity: string): void {
  toast.success(`${entity} updated successfully`);
}

/**
 * Show a success toast for delete operations
 */
export function showDeleted(entity: string): void {
  toast.success(`${entity} deleted successfully`);
}

/**
 * Show an error toast for failed operations
 */
export function showFailedOperation(operation: string, error: unknown): void {
  const message = getErrorMessage(error, `Failed to ${operation}`);
  toast.error(message);
}
