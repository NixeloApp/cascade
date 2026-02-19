import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "sidebar-collapsed";

interface SidebarContextValue {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapse: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile sidebar on route change (handled by consumers)
  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const toggleMobile = () => {
    setIsMobileOpen((prev) => !prev);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        toggleCollapse,
        toggleMobile,
        closeMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarState() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarState must be used within a SidebarProvider");
  }
  return context;
}
