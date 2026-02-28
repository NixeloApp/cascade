import { useCallback, useEffect, useRef, useState } from "react";

const DRAFT_PREFIX = "cascade_draft_";
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface DraftData<T> {
  data: T;
  timestamp: number;
}

interface UseDraftAutoSaveOptions<T> {
  /** Unique key for this draft (e.g., "create-issue", "create-document") */
  key: string;
  /** Optional sub-key for context (e.g., projectId) */
  contextKey?: string;
  /** Debounce delay in ms (default: 500) */
  debounceMs?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Callback when draft is loaded */
  onDraftLoaded?: (data: T) => void;
}

interface UseDraftAutoSaveReturn<T> {
  /** Whether a draft exists for this key */
  hasDraft: boolean;
  /** The draft data if it exists */
  draft: T | null;
  /** Save current data as draft */
  saveDraft: (data: T) => void;
  /** Clear the draft */
  clearDraft: () => void;
  /** Load and apply the draft (triggers onDraftLoaded) */
  loadDraft: () => T | null;
  /** Timestamp of the draft */
  draftTimestamp: number | null;
}

/**
 * Hook for auto-saving form drafts to localStorage.
 * Prevents data loss when modals are accidentally closed.
 */
export function useDraftAutoSave<T>({
  key,
  contextKey,
  debounceMs = 500,
  enabled = true,
  onDraftLoaded,
}: UseDraftAutoSaveOptions<T>): UseDraftAutoSaveReturn<T> {
  const storageKey = contextKey ? `${DRAFT_PREFIX}${key}_${contextKey}` : `${DRAFT_PREFIX}${key}`;
  const [hasDraft, setHasDraft] = useState(false);
  const [draft, setDraft] = useState<T | null>(null);
  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for existing draft on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: DraftData<T> = JSON.parse(stored);
        // Check if draft has expired
        if (Date.now() - parsed.timestamp < DRAFT_EXPIRY_MS) {
          setHasDraft(true);
          setDraft(parsed.data);
          setDraftTimestamp(parsed.timestamp);
        } else {
          // Clear expired draft
          localStorage.removeItem(storageKey);
        }
      }
    } catch {
      // Invalid stored data, clear it
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, enabled]);

  // Save draft (debounced)
  const saveDraft = useCallback(
    (data: T) => {
      if (!enabled) return;

      // Clear existing timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce the save
      debounceRef.current = setTimeout(() => {
        try {
          const draftData: DraftData<T> = {
            data,
            timestamp: Date.now(),
          };
          localStorage.setItem(storageKey, JSON.stringify(draftData));
          setHasDraft(true);
          setDraft(data);
          setDraftTimestamp(draftData.timestamp);
        } catch {
          // localStorage might be full or unavailable
          console.warn("Failed to save draft to localStorage");
        }
      }, debounceMs);
    },
    [storageKey, debounceMs, enabled],
  );

  // Clear draft
  const clearDraft = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setDraft(null);
    setDraftTimestamp(null);
  }, [storageKey]);

  // Load draft and trigger callback
  const loadDraft = useCallback(() => {
    if (draft && onDraftLoaded) {
      onDraftLoaded(draft);
    }
    return draft;
  }, [draft, onDraftLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    hasDraft,
    draft,
    saveDraft,
    clearDraft,
    loadDraft,
    draftTimestamp,
  };
}
