import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider, useSidebarState } from "./useSidebarState";

// Mock localStorage with fresh store for each test
let localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    localStorageStore = {};
  }),
};

Object.defineProperty(window, "localStorage", { value: localStorageMock });

const wrapper = ({ children }: { children: ReactNode }) => (
  <SidebarProvider>{children}</SidebarProvider>
);

describe("useSidebarState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage store
    localStorageStore = {};
  });

  describe("context requirement", () => {
    it("should throw error when used outside SidebarProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useSidebarState());
      }).toThrow("useSidebarState must be used within a SidebarProvider");

      consoleSpy.mockRestore();
    });

    it("should not throw when used within SidebarProvider", () => {
      expect(() => {
        renderHook(() => useSidebarState(), { wrapper });
      }).not.toThrow();
    });
  });

  describe("initial state", () => {
    it("should start with sidebar expanded by default", () => {
      const { result } = renderHook(() => useSidebarState(), { wrapper });

      expect(result.current.isCollapsed).toBe(false);
    });

    it("should start with mobile sidebar closed", () => {
      const { result } = renderHook(() => useSidebarState(), { wrapper });

      expect(result.current.isMobileOpen).toBe(false);
    });

    it("should restore collapsed state from localStorage", () => {
      localStorageStore["sidebar-collapsed"] = "true";

      const { result } = renderHook(() => useSidebarState(), { wrapper });

      expect(result.current.isCollapsed).toBe(true);
    });

    it("should default to expanded when localStorage has no value", () => {
      // Ensure localStorage is empty
      localStorageStore = {};

      const { result } = renderHook(() => useSidebarState(), { wrapper });

      expect(result.current.isCollapsed).toBe(false);
    });
  });

  describe("toggleCollapse", () => {
    it("should toggle isCollapsed from false to true", () => {
      const { result } = renderHook(() => useSidebarState(), { wrapper });

      expect(result.current.isCollapsed).toBe(false);

      act(() => {
        result.current.toggleCollapse();
      });

      expect(result.current.isCollapsed).toBe(true);
    });

    it("should toggle isCollapsed from true to false", () => {
      localStorageStore["sidebar-collapsed"] = "true";
      const { result } = renderHook(() => useSidebarState(), { wrapper });

      expect(result.current.isCollapsed).toBe(true);

      act(() => {
        result.current.toggleCollapse();
      });

      expect(result.current.isCollapsed).toBe(false);
    });

    it("should persist collapse state to localStorage", () => {
      const { result } = renderHook(() => useSidebarState(), { wrapper });

      act(() => {
        result.current.toggleCollapse();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith("sidebar-collapsed", "true");
    });
  });

  describe("toggleMobile", () => {
    it("should toggle isMobileOpen from false to true", () => {
      const { result } = renderHook(() => useSidebarState(), { wrapper });

      expect(result.current.isMobileOpen).toBe(false);

      act(() => {
        result.current.toggleMobile();
      });

      expect(result.current.isMobileOpen).toBe(true);
    });

    it("should toggle isMobileOpen from true to false", () => {
      const { result } = renderHook(() => useSidebarState(), { wrapper });

      act(() => {
        result.current.toggleMobile();
      });

      expect(result.current.isMobileOpen).toBe(true);

      act(() => {
        result.current.toggleMobile();
      });

      expect(result.current.isMobileOpen).toBe(false);
    });
  });

  describe("closeMobile", () => {
    it("should close mobile sidebar when open", () => {
      const { result } = renderHook(() => useSidebarState(), { wrapper });

      // Open mobile sidebar first
      act(() => {
        result.current.toggleMobile();
      });

      expect(result.current.isMobileOpen).toBe(true);

      // Close it
      act(() => {
        result.current.closeMobile();
      });

      expect(result.current.isMobileOpen).toBe(false);
    });

    it("should do nothing when mobile sidebar already closed", () => {
      const { result } = renderHook(() => useSidebarState(), { wrapper });

      expect(result.current.isMobileOpen).toBe(false);

      act(() => {
        result.current.closeMobile();
      });

      expect(result.current.isMobileOpen).toBe(false);
    });
  });

  describe("function stability", () => {
    it("should have stable toggleCollapse reference", () => {
      const { result, rerender } = renderHook(() => useSidebarState(), { wrapper });

      const firstRef = result.current.toggleCollapse;
      rerender();
      const secondRef = result.current.toggleCollapse;

      expect(firstRef).toBe(secondRef);
    });

    it("should have stable toggleMobile reference", () => {
      const { result, rerender } = renderHook(() => useSidebarState(), { wrapper });

      const firstRef = result.current.toggleMobile;
      rerender();
      const secondRef = result.current.toggleMobile;

      expect(firstRef).toBe(secondRef);
    });

    it("should have stable closeMobile reference", () => {
      const { result, rerender } = renderHook(() => useSidebarState(), { wrapper });

      const firstRef = result.current.closeMobile;
      rerender();
      const secondRef = result.current.closeMobile;

      expect(firstRef).toBe(secondRef);
    });
  });

  describe("independence of collapse and mobile states", () => {
    it("should allow both states to be true simultaneously", () => {
      // Set up collapsed state via localStorage before render
      localStorageStore["sidebar-collapsed"] = "true";

      const { result } = renderHook(() => useSidebarState(), { wrapper });

      act(() => {
        result.current.toggleMobile();
      });

      expect(result.current.isCollapsed).toBe(true);
      expect(result.current.isMobileOpen).toBe(true);
    });

    it("should not affect mobile state when toggling collapse", () => {
      // Ensure localStorage starts empty (expanded)
      localStorageStore = {};

      const { result } = renderHook(() => useSidebarState(), { wrapper });

      // Open mobile sidebar
      act(() => {
        result.current.toggleMobile();
      });

      expect(result.current.isMobileOpen).toBe(true);
      expect(result.current.isCollapsed).toBe(false);

      // Toggle collapse - should not affect mobile
      act(() => {
        result.current.toggleCollapse();
      });

      expect(result.current.isMobileOpen).toBe(true);
      expect(result.current.isCollapsed).toBe(true);
    });

    it("should not affect collapse state when closing mobile", () => {
      localStorageStore["sidebar-collapsed"] = "true";
      const { result } = renderHook(() => useSidebarState(), { wrapper });

      act(() => {
        result.current.toggleMobile();
      });

      act(() => {
        result.current.closeMobile();
      });

      expect(result.current.isCollapsed).toBe(true);
      expect(result.current.isMobileOpen).toBe(false);
    });
  });
});
