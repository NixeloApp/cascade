/**
 * IssueViewModeContext - Manages user preference for issue detail display
 *
 * Allows switching between modal view (centered dialog) and peek view (side panel).
 * Preference is persisted to localStorage.
 */

import { createContext, useContext, useEffect, useState } from "react";

export type IssueViewMode = "modal" | "peek";

const STORAGE_KEY = "issue-view-mode";

interface IssueViewModeContextValue {
  viewMode: IssueViewMode;
  setViewMode: (mode: IssueViewMode) => void;
  toggleViewMode: () => void;
}

const IssueViewModeContext = createContext<IssueViewModeContextValue | null>(null);

export function IssueViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<IssueViewMode>(() => {
    if (typeof window === "undefined") return "modal";
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "peek" ? "peek" : "modal";
  });

  // Persist preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  const setViewMode = (mode: IssueViewMode) => {
    setViewModeState(mode);
  };

  const toggleViewMode = () => {
    setViewModeState((prev) => (prev === "modal" ? "peek" : "modal"));
  };

  return (
    <IssueViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode }}>
      {children}
    </IssueViewModeContext.Provider>
  );
}

export function useIssueViewMode() {
  const context = useContext(IssueViewModeContext);
  if (!context) {
    throw new Error("useIssueViewMode must be used within an IssueViewModeProvider");
  }
  return context;
}
