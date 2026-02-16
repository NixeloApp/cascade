import type { Id } from "@convex/_generated/dataModel";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { OrgContext, type OrgContextType, useOrganization, useOrganizationOptional } from "./useOrgContext";

const mockOrgContext: OrgContextType = {
  organizationId: "test-org-id" as Id<"organizations">,
  orgSlug: "test-org",
  organizationName: "Test Organization",
  userRole: "admin",
  billingEnabled: true,
};

function createWrapper(contextValue: OrgContextType | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <OrgContext.Provider value={contextValue}>{children}</OrgContext.Provider>;
  };
}

describe("useOrganization", () => {
  it("should return organization context when available", () => {
    const { result } = renderHook(() => useOrganization(), {
      wrapper: createWrapper(mockOrgContext),
    });

    expect(result.current.organizationId).toBe("test-org-id");
    expect(result.current.orgSlug).toBe("test-org");
    expect(result.current.organizationName).toBe("Test Organization");
    expect(result.current.userRole).toBe("admin");
    expect(result.current.billingEnabled).toBe(true);
  });

  it("should throw error when used outside context", () => {
    expect(() => {
      renderHook(() => useOrganization(), {
        wrapper: createWrapper(null),
      });
    }).toThrow("useOrganization must be used within an organization route");
  });

  it("should return different user roles", () => {
    const ownerContext: OrgContextType = { ...mockOrgContext, userRole: "owner" };
    const { result: ownerResult } = renderHook(() => useOrganization(), {
      wrapper: createWrapper(ownerContext),
    });
    expect(ownerResult.current.userRole).toBe("owner");

    const memberContext: OrgContextType = { ...mockOrgContext, userRole: "member" };
    const { result: memberResult } = renderHook(() => useOrganization(), {
      wrapper: createWrapper(memberContext),
    });
    expect(memberResult.current.userRole).toBe("member");
  });

  it("should return billingEnabled false", () => {
    const noBillingContext: OrgContextType = { ...mockOrgContext, billingEnabled: false };
    const { result } = renderHook(() => useOrganization(), {
      wrapper: createWrapper(noBillingContext),
    });
    expect(result.current.billingEnabled).toBe(false);
  });
});

describe("useOrganizationOptional", () => {
  it("should return organization context when available", () => {
    const { result } = renderHook(() => useOrganizationOptional(), {
      wrapper: createWrapper(mockOrgContext),
    });

    expect(result.current).not.toBeNull();
    expect(result.current?.organizationId).toBe("test-org-id");
    expect(result.current?.orgSlug).toBe("test-org");
  });

  it("should return null when used outside context", () => {
    const { result } = renderHook(() => useOrganizationOptional(), {
      wrapper: createWrapper(null),
    });

    expect(result.current).toBeNull();
  });

  it("should not throw when context is missing", () => {
    expect(() => {
      const { result } = renderHook(() => useOrganizationOptional(), {
        wrapper: createWrapper(null),
      });
      // Access result to ensure no error
      return result.current;
    }).not.toThrow();
  });
});

describe("OrgContext", () => {
  it("should have correct default value (null)", () => {
    // Render without a provider to verify default
    const { result } = renderHook(() => useOrganizationOptional());

    expect(result.current).toBeNull();
  });
});
