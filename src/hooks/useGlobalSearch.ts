import { matchesKeyboardEvent, parseHotkey } from "@tanstack/hotkeys";
import { useEffect, useState } from "react";

type TabType = "all" | "issues" | "documents";
const OPEN_SEARCH_HOTKEYS = [parseHotkey("Meta+K"), parseHotkey("Control+K")];
const CLOSE_SEARCH_HOTKEY = parseHotkey("Escape");

const initialSearchState = {
  isOpen: false,
  query: "",
  activeTab: "all" as TabType,
  issueOffset: 0,
  documentOffset: 0,
};

const persistedSearchState = {
  ...initialSearchState,
};

function resetPersistedSearchState() {
  persistedSearchState.isOpen = initialSearchState.isOpen;
  persistedSearchState.query = initialSearchState.query;
  persistedSearchState.activeTab = initialSearchState.activeTab;
  persistedSearchState.issueOffset = initialSearchState.issueOffset;
  persistedSearchState.documentOffset = initialSearchState.documentOffset;
}

/**
 * Resets the persisted module state between tests.
 */
export function resetGlobalSearchStateForTests() {
  resetPersistedSearchState();
}

/**
 * Hook to manage global search open/close state with keyboard shortcuts
 */
export function useSearchKeyboard() {
  const [isOpen, setIsOpenState] = useState(persistedSearchState.isOpen);

  const setIsOpen = (open: boolean) => {
    persistedSearchState.isOpen = open;
    setIsOpenState(open);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (OPEN_SEARCH_HOTKEYS.some((hotkey) => matchesKeyboardEvent(event, hotkey))) {
        event.preventDefault();
        persistedSearchState.isOpen = true;
        setIsOpenState(true);
        return;
      }

      if (matchesKeyboardEvent(event, CLOSE_SEARCH_HOTKEY)) {
        persistedSearchState.isOpen = false;
        setIsOpenState(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}

interface SearchPaginationState {
  query: string;
  setQuery: (query: string) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  issueOffset: number;
  documentOffset: number;
  limit: number;
  loadMore: (issueHasMore: boolean, documentHasMore: boolean) => void;
}

/**
 * Hook to manage search pagination and query state
 */
export function useSearchPagination(isOpen: boolean): SearchPaginationState {
  const [query, setQueryInternal] = useState(persistedSearchState.query);
  const [activeTab, setActiveTabInternal] = useState<TabType>(persistedSearchState.activeTab);
  const [issueOffset, setIssueOffsetInternal] = useState(persistedSearchState.issueOffset);
  const [documentOffset, setDocumentOffsetInternal] = useState(persistedSearchState.documentOffset);
  const limit = 20;

  // Reset query and offsets when closing
  useEffect(() => {
    if (!isOpen) {
      resetPersistedSearchState();
      setQueryInternal("");
      setActiveTabInternal("all");
      setIssueOffsetInternal(0);
      setDocumentOffsetInternal(0);
      return;
    }

    // Rehydrate local state after a transient remount while the search is still open.
    setQueryInternal(persistedSearchState.query);
    setActiveTabInternal(persistedSearchState.activeTab);
    setIssueOffsetInternal(persistedSearchState.issueOffset);
    setDocumentOffsetInternal(persistedSearchState.documentOffset);
  }, [isOpen]);

  const setQuery = (newQuery: string) => {
    persistedSearchState.query = newQuery;
    persistedSearchState.issueOffset = 0;
    persistedSearchState.documentOffset = 0;
    setQueryInternal(newQuery);
    setIssueOffsetInternal(0);
    setDocumentOffsetInternal(0);
  };

  const setActiveTab = (tab: TabType) => {
    persistedSearchState.activeTab = tab;
    setActiveTabInternal(tab);
  };

  const setIssueOffset = (value: number | ((prev: number) => number)) => {
    setIssueOffsetInternal((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      persistedSearchState.issueOffset = next;
      return next;
    });
  };

  const setDocumentOffset = (value: number | ((prev: number) => number)) => {
    setDocumentOffsetInternal((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      persistedSearchState.documentOffset = next;
      return next;
    });
  };

  const loadMore = (issueHasMore: boolean, documentHasMore: boolean) => {
    const shouldLoadIssues = (activeTab === "all" || activeTab === "issues") && issueHasMore;
    const shouldLoadDocs = (activeTab === "all" || activeTab === "documents") && documentHasMore;

    if (shouldLoadIssues) {
      setIssueOffset((prev) => prev + limit);
    }
    if (shouldLoadDocs) {
      setDocumentOffset((prev) => prev + limit);
    }
  };

  return {
    query,
    setQuery,
    activeTab,
    setActiveTab,
    issueOffset,
    documentOffset,
    limit,
    loadMore,
  };
}
