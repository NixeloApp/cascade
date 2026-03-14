import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@/test/custom-render";
import { OrgContext, useOrganization, useOrganizationOptional } from "./useOrgContext";

const organizationValue = {
  organizationId: "org_1" as Id<"organizations">,
  orgSlug: "acme",
  organizationName: "Acme Inc",
  userRole: "admin" as const,
  billingEnabled: true,
};

function OrgProvider({ children }: { children: ReactNode }) {
  return <OrgContext.Provider value={organizationValue}>{children}</OrgContext.Provider>;
}

describe("useOrgContext", () => {
  it("returns the current organization when the provider is present", () => {
    const { result } = renderHook(() => useOrganization(), {
      wrapper: OrgProvider,
    });

    expect(result.current).toEqual(organizationValue);
  });

  it("throws when useOrganization is called outside the provider", () => {
    expect(() => renderHook(() => useOrganization())).toThrow(
      "useOrganization must be used within an organization route",
    );
  });

  it("returns null from the optional hook when the provider is missing", () => {
    const { result } = renderHook(() => useOrganizationOptional());

    expect(result.current).toBeNull();
  });

  it("returns the organization from the optional hook when the provider is present", () => {
    const { result } = renderHook(() => useOrganizationOptional(), {
      wrapper: OrgProvider,
    });

    expect(result.current).toEqual(organizationValue);
  });
});
