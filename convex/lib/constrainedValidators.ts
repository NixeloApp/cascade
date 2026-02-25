/**
 * Constrained Validators
 *
 * Validators with size/length constraints for security and performance.
 * These prevent DoS attacks via unbounded input and ensure data integrity.
 *
 * Usage:
 *   import { validate } from "./lib/constrainedValidators";
 *
 *   handler: async (ctx, args) => {
 *     validate.title(args.title);
 *     validate.description(args.description);
 *     // ...
 *   }
 */

import { validation } from "./errors";

// =============================================================================
// String Constraints
// =============================================================================

/**
 * Standard length limits for common field types
 */
export const STRING_LIMITS = {
  /** Short identifiers like project keys */
  KEY: { min: 1, max: 10 },
  /** Short names like project/team names */
  NAME: { min: 1, max: 100 },
  /** Titles for issues, documents, etc. */
  TITLE: { min: 1, max: 200 },
  /** Short descriptions, summaries */
  SHORT_DESCRIPTION: { min: 0, max: 500 },
  /** Full descriptions, comments */
  DESCRIPTION: { min: 0, max: 10000 },
  /** Long content like document body */
  CONTENT: { min: 0, max: 100000 },
  /** URLs */
  URL: { min: 0, max: 2048 },
  /** Email addresses */
  EMAIL: { min: 3, max: 254 },
  /** Slugs for URLs */
  SLUG: { min: 1, max: 50 },
} as const;

/**
 * Standard limits for arrays
 */
export const ARRAY_LIMITS = {
  /** Tags, labels, etc. */
  TAGS: { min: 0, max: 50 },
  /** Team members, assignees */
  MEMBERS: { min: 0, max: 100 },
  /** Shared with teams */
  SHARED_TEAMS: { min: 0, max: 50 },
  /** Workflow states */
  WORKFLOW_STATES: { min: 1, max: 20 },
  /** Bulk operations */
  BULK_IDS: { min: 1, max: 100 },
  /** Search results */
  SEARCH_RESULTS: { min: 0, max: 100 },
} as const;

// =============================================================================
// Validation Helpers (Runtime)
// =============================================================================

/**
 * Validate string length at runtime.
 * Throws a descriptive error if validation fails.
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength: number,
  maxLength: number,
): void {
  if (value.length < minLength) {
    throw validation(
      fieldName,
      `${fieldName} must be at least ${minLength} characters (got ${value.length})`,
    );
  }
  if (value.length > maxLength) {
    throw validation(
      fieldName,
      `${fieldName} must be at most ${maxLength} characters (got ${value.length})`,
    );
  }
}

/**
 * Validate array length at runtime.
 * Throws a descriptive error if validation fails.
 */
export function validateArrayLength<T>(
  value: T[],
  fieldName: string,
  minLength: number,
  maxLength: number,
): void {
  if (value.length < minLength) {
    throw validation(
      fieldName,
      `${fieldName} must have at least ${minLength} items (got ${value.length})`,
    );
  }
  if (value.length > maxLength) {
    throw validation(
      fieldName,
      `${fieldName} must have at most ${maxLength} items (got ${value.length})`,
    );
  }
}

/**
 * Validate a project key format.
 * Must be 2-10 uppercase alphanumeric characters, starting with a letter.
 */
export function validateProjectKey(key: string, fieldName = "projectKey"): void {
  const trimmed = key.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9]{1,9}$/.test(trimmed)) {
    throw validation(
      fieldName,
      `${fieldName} must be 2-10 uppercase alphanumeric characters, starting with a letter (e.g., PROJ, P1)`,
    );
  }
}

/**
 * Validate a slug format.
 * Must be lowercase letters, numbers, and hyphens.
 */
export function validateSlug(slug: string, fieldName = "slug"): void {
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug)) {
    throw validation(
      fieldName,
      `${fieldName} must be lowercase letters, numbers, and hyphens (e.g., my-project)`,
    );
  }
  validateStringLength(slug, fieldName, STRING_LIMITS.SLUG.min, STRING_LIMITS.SLUG.max);
}

/**
 * Validate email format (basic check).
 */
export function validateEmail(email: string, fieldName = "email"): void {
  validateStringLength(email, fieldName, STRING_LIMITS.EMAIL.min, STRING_LIMITS.EMAIL.max);
  if (!(email.includes("@") && email.includes("."))) {
    throw validation(fieldName, "Invalid email format");
  }
}

/**
 * Validate URL format (basic check).
 */
export function validateUrl(url: string, fieldName = "url"): void {
  validateStringLength(url, fieldName, 1, STRING_LIMITS.URL.max);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw validation(fieldName, `${fieldName} must be a valid URL`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw validation(fieldName, `${fieldName} must use http or https protocol`);
  }
}

/**
 * Validate an IANA timezone string.
 */
export function validateTimezone(timezone: string, fieldName = "timezone"): void {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    throw validation(fieldName, "Invalid IANA timezone (e.g., America/New_York)");
  }
}

// =============================================================================
// Common Pre-built Validators
// =============================================================================

/**
 * Validators for common field patterns.
 * Use these in mutation handlers after the Convex validator has run.
 */
export const validate = {
  /** Validate a project key (2-10 uppercase letters) */
  projectKey: (key: string, fieldName = "projectKey") => validateProjectKey(key, fieldName),

  /** Validate a name field (1-100 chars) */
  name: (value: string, fieldName = "name") =>
    validateStringLength(value, fieldName, STRING_LIMITS.NAME.min, STRING_LIMITS.NAME.max),

  /** Validate a title field (1-200 chars) */
  title: (value: string, fieldName = "title") =>
    validateStringLength(value, fieldName, STRING_LIMITS.TITLE.min, STRING_LIMITS.TITLE.max),

  /** Validate a description field (0-10000 chars) */
  description: (value: string | undefined, fieldName = "description") => {
    if (value !== undefined) {
      validateStringLength(
        value,
        fieldName,
        STRING_LIMITS.DESCRIPTION.min,
        STRING_LIMITS.DESCRIPTION.max,
      );
    }
  },

  /** Validate a bio/short description field (0-500 chars) */
  bio: (value: string | undefined, fieldName = "bio") => {
    if (value !== undefined) {
      validateStringLength(
        value,
        fieldName,
        STRING_LIMITS.SHORT_DESCRIPTION.min,
        STRING_LIMITS.SHORT_DESCRIPTION.max,
      );
    }
  },

  /** Validate tags array (0-50 items) */
  tags: <T>(value: T[], fieldName = "tags") =>
    validateArrayLength(value, fieldName, ARRAY_LIMITS.TAGS.min, ARRAY_LIMITS.TAGS.max),

  /** Validate bulk IDs array (1-100 items) */
  bulkIds: <T>(value: T[], fieldName = "ids") =>
    validateArrayLength(value, fieldName, ARRAY_LIMITS.BULK_IDS.min, ARRAY_LIMITS.BULK_IDS.max),

  /** Validate URL */
  url: (value: string | undefined, fieldName = "url") => {
    if (value !== undefined) {
      validateUrl(value, fieldName);
    }
  },

  /** Validate email */
  email: (value: string, fieldName = "email") => validateEmail(value, fieldName),

  /** Validate slug */
  slug: (value: string, fieldName = "slug") => validateSlug(value, fieldName),

  /** Validate IANA timezone */
  timezone: (value: string, fieldName = "timezone") => validateTimezone(value, fieldName),
};
