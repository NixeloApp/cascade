/**
 * Fuzzy Search Hook
 *
 * Provides client-side fuzzy/typo-tolerant search using Fuse.js.
 * Use this for interactive dropdowns, autocomplete, and live filtering
 * where users might make typos or want approximate matches.
 *
 * For server-side global search with permissions, use Convex search.
 */

import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";

export interface FuzzySearchOptions {
  /**
   * Fields to search in (supports nested paths like "user.name")
   */
  keys: Array<string | { name: string; weight?: number }>;

  /**
   * Search threshold (0.0 = exact match, 1.0 = match anything)
   * Default: 0.4 (balanced between strict and permissive)
   */
  threshold?: number;

  /**
   * Minimum character length before searching
   * Default: 1
   */
  minMatchCharLength?: number;

  /**
   * Include score in results (useful for sorting by relevance)
   * Default: true
   */
  includeScore?: boolean;

  /**
   * Maximum results to return
   * Default: undefined (no limit)
   */
  limit?: number;

  /**
   * Debounce delay in milliseconds (0 = no debounce)
   * Useful for large datasets to reduce CPU usage
   * Default: 0
   */
  debounce?: number;

  /**
   * Sort by score (most relevant first)
   * Default: true
   */
  sortByScore?: boolean;
}

export interface FuzzySearchResult<T> {
  /**
   * The matched item
   */
  item: T;

  /**
   * Match score (0 = perfect match, 1 = worst match)
   * Only included if includeScore is true
   */
  score?: number;

  /**
   * Indices of matched characters (for highlighting)
   */
  matches?: Array<{
    indices: Array<[number, number]>;
    key?: string;
    value?: string;
  }>;

  /**
   * Reference index in original array
   */
  refIndex?: number;
}

/**
 * Highlight matching characters in a string
 *
 * @example
 * ```typescript
 * const highlighted = highlightMatches("John Doe", [[[0, 2]]]);
 * // Returns: [{ text: "Joh", highlight: true }, { text: "n Doe", highlight: false }]
 * ```
 */
export function highlightMatches(
  text: string,
  indices: Array<[number, number]> | undefined,
): Array<{ text: string; highlight: boolean }> {
  if (!indices || indices.length === 0) {
    return [{ text, highlight: false }];
  }

  const result: Array<{ text: string; highlight: boolean }> = [];
  let lastIndex = 0;

  for (const [start, end] of indices) {
    // Add non-highlighted text before this match
    if (start > lastIndex) {
      result.push({ text: text.slice(lastIndex, start), highlight: false });
    }

    // Add highlighted match
    result.push({ text: text.slice(start, end + 1), highlight: true });
    lastIndex = end + 1;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), highlight: false });
  }

  return result;
}

/**
 * Hook for fuzzy searching through an array of items
 *
 * @example
 * ```typescript
 * const users = useQuery(api.users.list); // Load from Convex
 *
 * const { results, search, query, isSearching } = useFuzzySearch(users, {
 *   keys: ["name", "email"],
 *   threshold: 0.3,
 *   debounce: 150, // Wait 150ms after user stops typing
 * });
 *
 * // In your component
 * <input
 *   value={query}
 *   onChange={(e) => search(e.target.value)}
 *   placeholder="Search users..."
 * />
 * {results.map(({ item, score, matches }) => (
 *   <div key={item._id}>
 *     <span>{item.name}</span>
 *     {score && <span className="text-ui-text-secondary">({(score * 100).toFixed(0)}%)</span>}
 *   </div>
 * ))}
 * ```
 */
export function useFuzzySearch<T>(items: T[] | undefined, options: FuzzySearchOptions) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce query updates
  useEffect(() => {
    if (options.debounce && options.debounce > 0) {
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedQuery(query);
      }, options.debounce);

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }
    setDebouncedQuery(query);
  }, [query, options.debounce]);

  // Create Fuse instance - memoized to avoid rebuilding index on every render
  const fuse = useMemo(
    () =>
      !items || items.length === 0
        ? null
        : new Fuse(items, {
            keys: options.keys,
            threshold: options.threshold ?? 0.4,
            minMatchCharLength: options.minMatchCharLength ?? 1,
            includeScore: options.includeScore ?? true,
            includeMatches: true, // For highlighting support
            // Performance optimizations
            ignoreLocation: true, // Match anywhere in the string (faster)
            useExtendedSearch: false,
            findAllMatches: false,
            // Sorting
            shouldSort: options.sortByScore ?? true,
          }),
    [
      items,
      options.keys,
      options.threshold,
      options.minMatchCharLength,
      options.includeScore,
      options.sortByScore,
    ],
  );

  // Perform search
  const results =
    fuse && debouncedQuery.trim()
      ? (fuse.search(debouncedQuery) as FuzzySearchResult<T>[]).slice(0, options.limit)
      : (items?.map((item) => ({ item, score: 0 })) ?? []);

  /**
   * Update search query
   */
  const search = (newQuery: string) => {
    setQuery(newQuery);
  };

  /**
   * Clear search query
   */
  const clear = () => {
    setQuery("");
    setDebouncedQuery("");
  };

  return {
    /**
     * Search results (empty query returns all items)
     */
    results,

    /**
     * Current search query (immediate, not debounced)
     */
    query,

    /**
     * Debounced query (what's actually being searched)
     */
    debouncedQuery,

    /**
     * Update search query
     */
    search,

    /**
     * Clear search
     */
    clear,

    /**
     * Whether currently searching (non-empty query)
     */
    isSearching: query.trim().length > 0,

    /**
     * Whether waiting for debounce
     */
    isDebouncing: query !== debouncedQuery,

    /**
     * Whether there are any results
     */
    hasResults: results.length > 0,

    /**
     * Number of total items being searched
     */
    totalItems: items?.length ?? 0,
  };
}

/**
 * Pre-configured hook for searching users
 *
 * @example
 * ```typescript
 * const members = useQuery(api.projects.getMembers, { projectId });
 * const { results, search, query } = useUserFuzzySearch(members);
 * ```
 */
export function useUserFuzzySearch<T extends { name?: string; email?: string }>(
  users: T[] | undefined,
) {
  return useFuzzySearch(users, {
    keys: [
      { name: "name", weight: 2 }, // Prioritize name matches
      { name: "email", weight: 1 },
    ],
    threshold: 0.3, // Stricter for names
    limit: 10, // Top 10 results
    debounce: 100, // Debounce for responsive UX
  });
}

/**
 * Pre-configured hook for searching projects
 *
 * @example
 * ```typescript
 * const projects = useQuery(api.projects.getCurrentUserProjects);
 * const { results, search, query } = useProjectFuzzySearch(projects);
 * ```
 */
export function useProjectFuzzySearch(
  projects: Array<{ name: string; key: string; description?: string }> | undefined,
) {
  return useFuzzySearch(projects, {
    keys: [
      { name: "name", weight: 3 },
      { name: "key", weight: 2 },
      { name: "description", weight: 1 },
    ],
    threshold: 0.35,
    limit: 15,
    debounce: 150,
  });
}

/**
 * Pre-configured hook for searching issues
 *
 * @example
 * ```typescript
 * const issues = useQuery(api.issues.list, { projectId });
 * const { results, search, query } = useIssueFuzzySearch(issues);
 * ```
 */
export function useIssueFuzzySearch(
  issues: Array<{ title: string; key: string; description?: string }> | undefined,
) {
  return useFuzzySearch(issues, {
    keys: [
      { name: "key", weight: 3 }, // PROJ-123 should match strongly
      { name: "title", weight: 2 },
      { name: "description", weight: 1 },
    ],
    threshold: 0.3,
    limit: 20,
    debounce: 150,
  });
}

/**
 * Pre-configured hook for searching sprints
 *
 * @example
 * ```typescript
 * const sprints = useQuery(api.sprints.list, { projectId });
 * const { results, search, query } = useSprintFuzzySearch(sprints);
 * ```
 */
export function useSprintFuzzySearch(sprints: Array<{ name: string; goal?: string }> | undefined) {
  return useFuzzySearch(sprints, {
    keys: [
      { name: "name", weight: 2 },
      { name: "goal", weight: 1 },
    ],
    threshold: 0.3,
    limit: 10,
    debounce: 100,
  });
}

/**
 * Pre-configured hook for searching labels/tags
 *
 * @example
 * ```typescript
 * const labels = ["bug", "feature", "enhancement"];
 * const { results, search, query } = useLabelFuzzySearch(labels);
 * ```
 */
export function useLabelFuzzySearch(labels: string[] | undefined) {
  return useFuzzySearch(
    labels?.map((label) => ({ label })),
    {
      keys: ["label"],
      threshold: 0.2, // Very strict for labels
      limit: 10,
      debounce: 100,
    },
  );
}

/**
 * Pre-configured hook for searching documents
 *
 * @example
 * ```typescript
 * const documentsResult = useQuery(api.documents.list, { organizationId });
 * const { results, search, query } = useDocumentFuzzySearch(documentsResult?.documents);
 * ```
 */
export function useDocumentFuzzySearch(
  documents: Array<{ title: string; description?: string }> | undefined,
) {
  return useFuzzySearch(documents, {
    keys: [
      { name: "title", weight: 2 },
      { name: "description", weight: 1 },
    ],
    threshold: 0.35,
    limit: 15,
    debounce: 200, // Slightly longer for documents
  });
}
