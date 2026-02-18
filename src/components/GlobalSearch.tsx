import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { useSearchKeyboard, useSearchPagination } from "@/hooks/useGlobalSearch";
import { Search } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/Command";
import { KeyboardShortcut, ShortcutHint } from "./ui/KeyboardShortcut";
import { Typography } from "./ui/Typography";

type SearchResult =
  | {
      _id: Id<"issues">;
      title: string;
      key: string;
      projectId: Id<"projects">;
      description?: string;
      type: "issue";
    }
  | {
      _id: Id<"documents">;
      title: string;
      description?: string;
      type: "document";
    };

// Helper function to get filtered results based on active tab
function getFilteredResults(
  activeTab: "all" | "issues" | "documents",
  issueResults: Doc<"issues">[],
  documentResults: Doc<"documents">[],
): SearchResult[] {
  const issueSearchResults = issueResults.map((r) => ({ ...r, type: "issue" as const }));
  const documentSearchResults = documentResults.map((r) => ({ ...r, type: "document" as const }));

  if (activeTab === "all") {
    return [...issueSearchResults, ...documentSearchResults];
  }
  if (activeTab === "issues") {
    return issueSearchResults;
  }
  return documentSearchResults;
}

// Helper function to get total count based on active tab
function getTotalCount(
  activeTab: "all" | "issues" | "documents",
  issueTotal: number,
  documentTotal: number,
): number {
  if (activeTab === "all") {
    return issueTotal + documentTotal;
  }
  if (activeTab === "issues") {
    return issueTotal;
  }
  return documentTotal;
}

// Helper function to check if there are more results
function getHasMore(
  activeTab: "all" | "issues" | "documents",
  issueHasMore: boolean,
  documentHasMore: boolean,
): boolean {
  if (activeTab === "all") {
    return issueHasMore || documentHasMore;
  }
  if (activeTab === "issues") {
    return issueHasMore;
  }
  return documentHasMore;
}

// Tab button component
function SearchTab({
  label,
  isActive,
  count,
  showCount,
  onClick,
}: {
  label: string;
  isActive: boolean;
  count: number;
  showCount: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pb-2 px-1 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
        isActive
          ? "border-brand-ring text-brand"
          : "border-transparent text-ui-text-secondary hover:text-ui-text",
      )}
    >
      {label}
      {showCount && ` (${count})`}
    </button>
  );
}

// Search list content component - renders based on query/loading state
function SearchListContent({
  query,
  isLoading,
  filteredResults,
  hasMore,
  totalCount,
  onClose,
  onLoadMore,
}: {
  query: string;
  isLoading: boolean;
  filteredResults: SearchResult[];
  hasMore: boolean;
  totalCount: number;
  onClose: () => void;
  onLoadMore: () => void;
}) {
  if (query.length < 2) {
    return (
      <Typography variant="small" color="secondary" className="text-center">
        Type at least 2 characters to search
      </Typography>
    );
  }

  if (isLoading) {
    return (
      <Flex direction="column" align="center" className="text-ui-text-secondary">
        <div className="inline-block w-6 h-6 border-2 border-brand-ring border-t-transparent rounded-full animate-spin mb-2" />
        <Typography variant="small">Searching...</Typography>
      </Flex>
    );
  }

  return (
    <>
      <CommandEmpty data-testid={TEST_IDS.GLOBAL_SEARCH.NO_RESULTS}>
        <Flex direction="column" align="center">
          <Icon icon={Search} size="xl" className="mb-4" />
          <Typography variant="label">No results found</Typography>
        </Flex>
      </CommandEmpty>
      {filteredResults.length > 0 && (
        <CommandGroup>
          {filteredResults.map((result) => (
            <SearchResultItem key={result._id} result={result} onClose={onClose} />
          ))}
        </CommandGroup>
      )}
      {hasMore && (
        <Flex className="border-t border-ui-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            className="w-full text-brand bg-brand-subtle hover:bg-brand-subtle:bg-brand-active/50"
          >
            Load More ({totalCount - filteredResults.length} remaining)
          </Button>
        </Flex>
      )}
    </>
  );
}

// Search result item component
function SearchResultItem({ result, onClose }: { result: SearchResult; onClose: () => void }) {
  const href =
    result.type === "issue"
      ? `/project/${result.projectId}?issue=${result._id}`
      : `/document/${result._id}`;

  return (
    <CommandItem
      value={result._id}
      onSelect={() => {
        window.location.href = href;
        onClose();
      }}
      className="cursor-pointer data-[selected=true]:bg-ui-bg-secondary"
      data-testid={TEST_IDS.SEARCH.RESULT_ITEM}
    >
      <Flex align="start" gap="md" className="w-full">
        {/* Icon */}
        <Flex
          align="center"
          justify="center"
          className="shrink-0 w-8 h-8 rounded bg-ui-bg-tertiary"
        >
          {result.type === "issue" ? (
            <svg
              aria-hidden="true"
              className="w-5 h-5 text-brand"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              className="w-5 h-5 text-accent"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </Flex>

        {/* Content */}
        <FlexItem flex="1" className="min-w-0">
          <Flex align="center" gap="sm" wrap>
            {result.type === "issue" && <code className="font-mono text-sm">{result.key}</code>}
            <Badge variant="neutral" shape="pill" data-testid={TEST_IDS.SEARCH.RESULT_TYPE}>
              {result.type}
            </Badge>
          </Flex>
          <Typography variant="label" className="mt-1 truncate">
            {result.title}
          </Typography>
          <Typography variant="meta" className="mt-1 line-clamp-2">
            {result.description || "No description"}
          </Typography>
        </FlexItem>
      </Flex>
    </CommandItem>
  );
}

export function GlobalSearch() {
  const { isOpen, setIsOpen } = useSearchKeyboard();
  const { query, setQuery, activeTab, setActiveTab, issueOffset, documentOffset, limit, loadMore } =
    useSearchPagination(isOpen);

  // Search when query changes
  const issueSearchResult = useQuery(
    api.issues.search,
    query.length >= 2 ? { query, limit, offset: issueOffset } : "skip",
  );
  const documentSearchResult = useQuery(
    api.documents.search,
    query.length >= 2 ? { query, limit, offset: documentOffset } : "skip",
  );

  const issueResults = issueSearchResult?.page ?? [];
  const documentResults = documentSearchResult?.results ?? [];
  const issueTotal = issueSearchResult?.total ?? 0;
  const documentTotal = documentSearchResult?.total ?? 0;
  const issueHasMore = (issueSearchResult?.page?.length ?? 0) === limit;
  const documentHasMore = documentSearchResult?.hasMore ?? false;

  // Get filtered results based on active tab
  const filteredResults =
    query.length >= 2 ? getFilteredResults(activeTab, issueResults, documentResults) : [];

  const totalCount = getTotalCount(activeTab, issueTotal, documentTotal);
  const hasMore = getHasMore(activeTab, issueHasMore, documentHasMore);

  const handleLoadMore = () => {
    loadMore(issueHasMore, documentHasMore);
  };

  const isLoading =
    query.length >= 2 && (issueSearchResult === undefined || documentSearchResult === undefined);

  return (
    <>
      {/* Search Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        aria-label="Open search (⌘K)"
        className="bg-ui-bg-soft border border-ui-border/50 hover:bg-ui-bg-hover hover:border-ui-border text-ui-text-secondary hover:text-ui-text transition-all duration-default"
      >
        <svg
          aria-hidden="true"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <Typography variant="small" color="secondary">
          Search...
        </Typography>
        <KeyboardShortcut shortcut="⌘+K" className="hidden sm:inline-flex" />
      </Button>

      {/* Search Modal */}
      <CommandDialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
        <Command data-testid={TEST_IDS.SEARCH.MODAL} className="bg-ui-bg" shouldFilter={false}>
          <CommandInput
            placeholder="Search issues and documents..."
            value={query}
            onValueChange={setQuery}
            className="text-ui-text"
          />

          {/* Tabs with counts */}
          <Flex gap="sm" className="border-b border-ui-border overflow-x-auto">
            <SearchTab
              label="All"
              isActive={activeTab === "all"}
              count={issueTotal + documentTotal}
              showCount={query.length >= 2}
              onClick={() => setActiveTab("all")}
            />
            <SearchTab
              label="Issues"
              isActive={activeTab === "issues"}
              count={issueTotal}
              showCount={query.length >= 2}
              onClick={() => setActiveTab("issues")}
            />
            <SearchTab
              label="Documents"
              isActive={activeTab === "documents"}
              count={documentTotal}
              showCount={query.length >= 2}
              onClick={() => setActiveTab("documents")}
            />
          </Flex>

          <CommandList className="max-h-80 sm:max-h-96">
            <SearchListContent
              query={query}
              isLoading={isLoading}
              filteredResults={filteredResults}
              hasMore={hasMore}
              totalCount={totalCount}
              onClose={() => setIsOpen(false)}
              onLoadMore={handleLoadMore}
            />
          </CommandList>

          {/* Footer */}
          <Flex align="center" justify="between" className="border-t border-ui-border">
            <Flex align="center" gap="lg">
              <ShortcutHint keys="up+down">Navigate</ShortcutHint>
              <ShortcutHint keys="Enter">Open</ShortcutHint>
            </Flex>
            <ShortcutHint keys="Esc">Close</ShortcutHint>
          </Flex>
        </Command>
      </CommandDialog>
    </>
  );
}
