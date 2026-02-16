import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@/test/custom-render";
import {
  OrgContext,
  type OrgContextType,
  useOrganization,
  useOrganizationOptional,
} from "./useOrgContext";

const mockOrgContext: OrgContextType = {
  organizationId: "org123" as Id<"organizations">,
  orgSlug: "acme-corp",
  organizationName: "Acme Corporation",
  userRole: "admin",
  billingEnabled: true,
};

const createWrapper =
  (contextValue: OrgContextType | null) =>
  ({ children }: { children: ReactNode }) => (
    <OrgContext.Provider value={contextValue}>{children}</OrgContext.Provider>
  );

describe("useOrganization", () => {
  describe("With Context", () => {
    it("should return organization context when provided", () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(mockOrgContext),
      });

      expect(result.current).toEqual(mockOrgContext);
    });

    it("should provide access to organizationId", () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(mockOrgContext),
      });

      expect(result.current.organizationId).toBe("org123");
    });

    it("should provide access to orgSlug", () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(mockOrgContext),
      });

      expect(result.current.orgSlug).toBe("acme-corp");
    });

    it("should provide access to organizationName", () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(mockOrgContext),
      });

      expect(result.current.organizationName).toBe("Acme Corporation");
    });

    it("should provide access to userRole", () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(mockOrgContext),
      });

      expect(result.current.userRole).toBe("admin");
    });

    it("should provide access to billingEnabled", () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(mockOrgContext),
      });

      expect(result.current.billingEnabled).toBe(true);
    });
  });

  describe("Without Context", () => {
    it("should throw error when used outside organization route", () => {
      expect(() => {
        renderHook(() => useOrganization());
      }).toThrow("useOrganization must be used within an organization route");
    });
  });

  describe("Different User Roles", () => {
    it("should return owner role", () => {
      const ownerContext = { ...mockOrgContext, userRole: "owner" as const };
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(ownerContext),
      });

      expect(result.current.userRole).toBe("owner");
    });

    it("should return member role", () => {
      const memberContext = { ...mockOrgContext, userRole: "member" as const };
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(memberContext),
      });

      expect(result.current.userRole).toBe("member");
    });
  });

  describe("Billing States", () => {
    it("should handle billingEnabled=false", () => {
      const noBillingContext = { ...mockOrgContext, billingEnabled: false };
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(noBillingContext),
      });

      expect(result.current.billingEnabled).toBe(false);
    });
  });
});

describe("useOrganizationOptional", () => {
  describe("With Context", () => {
    it("should return organization context when provided", () => {
      const { result } = renderHook(() => useOrganizationOptional(), {
        wrapper: createWrapper(mockOrgContext),
      });

      expect(result.current).toEqual(mockOrgContext);
    });

    it("should provide access to all properties", () => {
      const { result } = renderHook(() => useOrganizationOptional(), {
        wrapper: createWrapper(mockOrgContext),
      });

      expect(result.current?.organizationId).toBe("org123");
      expect(result.current?.orgSlug).toBe("acme-corp");
      expect(result.current?.organizationName).toBe("Acme Corporation");
      expect(result.current?.userRole).toBe("admin");
      expect(result.current?.billingEnabled).toBe(true);
    });
  });

  describe("Without Context", () => {
    it("should return null when used outside organization route", () => {
      const { result } = renderHook(() => useOrganizationOptional());

      expect(result.current).toBeNull();
    });

    it("should not throw error when context is missing", () => {
      expect(() => {
        renderHook(() => useOrganizationOptional());
      }).not.toThrow();
    });
  });

  describe("Null Context Provider", () => {
    it("should return null when context value is explicitly null", () => {
      const { result } = renderHook(() => useOrganizationOptional(), {
        wrapper: createWrapper(null),
      });

      expect(result.current).toBeNull();
    });
  });
});

describe("OrgContext", () => {
  it("should have default value of null", () => {
    // Verify the context exists and can be used
    const { result } = renderHook(() => useOrganizationOptional());
    expect(result.current).toBeNull();
  });
});
