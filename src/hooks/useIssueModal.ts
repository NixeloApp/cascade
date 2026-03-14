import { useLocation, useRouter } from "@tanstack/react-router";

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
  const router = useRouter();
  const location = useLocation({
    select: (current) => ({
      hash: current.hash,
      pathname: current.pathname,
      search: current.search,
      state: current.state,
    }),
  });

  const issueKey = new URLSearchParams(location.search).get("issue") ?? undefined;
  const isOpen = !!issueKey;

  const navigateWithIssue = (issue: string | undefined, replace: boolean) => {
    const params = new URLSearchParams(location.search);

    if (issue) {
      params.set("issue", issue);
    } else {
      params.delete("issue");
    }

    const nextSearch = params.toString();
    const nextHref = `${location.pathname}${nextSearch ? `?${nextSearch}` : ""}${location.hash}`;

    if (replace) {
      router.history.replace(nextHref, location.state);
      return;
    }

    router.history.push(nextHref, location.state);
  };

  const openIssue = (key: string) => {
    navigateWithIssue(key, false);
  };

  const closeIssue = () => {
    navigateWithIssue(undefined, true);
  };

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
