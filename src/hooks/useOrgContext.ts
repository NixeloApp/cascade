import type { Id } from "@convex/_generated/dataModel";
import { createContext, useContext } from "react";

/**
 * organization context type
 * Contains information about the current organization from the URL
 */
export interface OrgContextType {
  organizationId: Id<"organizations">;
  orgSlug: string;
  organizationName: string;
  userRole: "owner" | "admin" | "member";
  billingEnabled: boolean;
}

/**
 * organization Context
 * This context is provided by the $orgSlug route layout
 * and consumed by components that need organization information.
 *
 * IMPORTANT: This context is defined in a separate file (not in the route file)
 * to prevent code-splitting issues with TanStack Router's file-based routing.
 * When the context is defined in the route file, it can be bundled separately
 * from consumer components, causing useContext to return null.
 */
export const OrgContext = createContext<OrgContextType | null>(null);

/**
 * Hook to access current organization from URL
 * Must be used within a $orgSlug route
 * @throws Error if used outside organization route context
 */
export function useOrganization(): OrgContextType {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrganization must be used within an organization route");
  }
  return context;
}

/**
 * Optional hook to access organization - returns null if not in organization context
 * Use this for components that might render before context is available
 * or that can gracefully handle missing organization context
 */
export function useOrganizationOptional(): OrgContextType | null {
  return useContext(OrgContext);
}
