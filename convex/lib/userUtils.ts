/**
 * User Utilities
 *
 * Helper functions for safely handling user data and preventing
 * sensitive field leakage in public contexts.
 */

import type { Doc } from "../_generated/dataModel";

/**
 * Public user fields that are safe to expose
 * Excludes sensitive data like email, phone, etc.
 */
export type PublicUser = {
  _id: Doc<"users">["_id"];
  name?: string;
  image?: string;
  email?: undefined;
};

/**
 * User fields for authenticated contexts
 * Includes email but still excludes highly sensitive data
 */
export type AuthenticatedUser = Omit<PublicUser, "email"> & {
  email?: string;
};

/**
 * Sanitize user object for public contexts
 * Strips all sensitive fields like email, phone, etc.
 *
 * Use this when returning user data that may be visible to
 * non-authenticated users or users who shouldn't see emails.
 */
export function sanitizeUserForPublic(user: Doc<"users"> | null | undefined): PublicUser | null {
  if (!user) return null;

  return {
    _id: user._id,
    name: user.name || "Unknown",
    image: user.image,
  };
}

/**
 * Sanitize user object for authenticated contexts
 * Includes email but strips other sensitive fields.
 *
 * Use this when returning user data to authenticated users
 * who should see email addresses (e.g., team members).
 */
export function sanitizeUserForAuth(
  user: Doc<"users"> | null | undefined,
): AuthenticatedUser | null {
  if (!user) return null;

  return {
    _id: user._id,
    name: user.name || user.email || "Unknown",
    email: user.email,
    image: user.image,
  };
}

/**
 * Sanitize multiple users for public contexts
 */
export function sanitizeUsersForPublic(
  users: (Doc<"users"> | null | undefined)[],
): (PublicUser | null)[] {
  return users.map(sanitizeUserForPublic);
}

/**
 * Sanitize multiple users for authenticated contexts
 */
export function sanitizeUsersForAuth(
  users: (Doc<"users"> | null | undefined)[],
): (AuthenticatedUser | null)[] {
  return users.map(sanitizeUserForAuth);
}
