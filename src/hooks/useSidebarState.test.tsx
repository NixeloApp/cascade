import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@/test/custom-render";
import { SidebarProvider, useSidebarState } from "./useSidebarState";

function SidebarWrapper({ children }: { children: ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}

describe("useSidebarState", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("throws when used outside the sidebar provider", () => {
    expect(() => renderHook(() => useSidebarState())).toThrow(
      "useSidebarState must be used within a SidebarProvider",
    );
  });

  it("starts expanded by default and persists collapse changes", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useSidebarState(), {
      wrapper: SidebarWrapper,
    });

    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.isMobileOpen).toBe(false);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith("sidebar-collapsed", "false");
    });

    act(() => {
      result.current.toggleCollapse();
    });

    expect(result.current.isCollapsed).toBe(true);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenLastCalledWith("sidebar-collapsed", "true");
    });
  });

  it("rehydrates the collapsed state from localStorage", async () => {
    window.localStorage.setItem("sidebar-collapsed", "true");
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    const { result } = renderHook(() => useSidebarState(), {
      wrapper: SidebarWrapper,
    });

    expect(result.current.isCollapsed).toBe(true);
    expect(result.current.isMobileOpen).toBe(false);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenLastCalledWith("sidebar-collapsed", "true");
    });
  });

  it("toggles and closes the mobile sidebar independently", () => {
    const { result } = renderHook(() => useSidebarState(), {
      wrapper: SidebarWrapper,
    });

    expect(result.current.isMobileOpen).toBe(false);

    act(() => {
      result.current.toggleMobile();
    });

    expect(result.current.isMobileOpen).toBe(true);
    expect(result.current.isCollapsed).toBe(false);

    act(() => {
      result.current.closeMobile();
    });

    expect(result.current.isMobileOpen).toBe(false);

    act(() => {
      result.current.toggleMobile();
      result.current.toggleMobile();
    });

    expect(result.current.isMobileOpen).toBe(false);
  });
});
