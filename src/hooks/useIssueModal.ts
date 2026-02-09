import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";

interface IssueModalSearch {
  issue?: string;
}

/**
 * Hook to manage issue detail modal via URL search params.
 * Reads/writes `?issue=ISSUE-KEY` to the URL.
 *
 * Usage:
 * - Add `validateSearch` to your route definition
 * - Call `openIssue(issueKey)` to open the modal
 * - Read `issueKey` to get the currently open issue
 * - Call `closeIssue()` to close the modal
 */
export function useIssueModal(): {
  issueKey: string | undefined;
  openIssue: (key: string) => void;
  closeIssue: () => void;
  isOpen: boolean;
} {
  const search = useSearch({ strict: false }) as IssueModalSearch;
  const navigate = useNavigate();

  const issueKey = search.issue;
  const isOpen = !!issueKey;

  const openIssue = useCallback(
    (key: string) => {
      navigate({
        search: ((prev: Record<string, unknown>) => ({ ...prev, issue: key })) as any,
        replace: false,
      });
    },
    [navigate],
  );

  const closeIssue = useCallback(() => {
    navigate({
      search: ((prev: Record<string, unknown>) => {
        const { issue: _, ...rest } = prev;
        return rest;
      }) as any,
      replace: true,
    });
  }, [navigate]);

  return { issueKey, openIssue, closeIssue, isOpen };
}

/**
 * Search validator for routes that support the issue modal.
 * Add this to your route's validateSearch option.
 */
export function validateIssueSearch(search: Record<string, unknown>): IssueModalSearch {
  return {
    issue: typeof search.issue === "string" ? search.issue : undefined,
  };
}
