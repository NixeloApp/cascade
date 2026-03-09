/**
 * Global Search
 *
 * Unified omnibox for search, navigation, and quick actions.
 * Supports keyboard navigation, type filtering, and advanced search handoff.
 * Opens with Cmd+K shortcut and provides paginated results plus command actions.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { type ComponentProps, useEffect, useState } from "react";
import { AdvancedSearchModal } from "@/components/AdvancedSearchModal";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useSearchKeyboard, useSearchPagination } from "@/hooks/useGlobalSearch";
import { ArrowRight, Command, Filter, Plus, Search } from "@/lib/icons";
import { parseIssueSearchShortcuts } from "@/lib/search-shortcuts";
import { TEST_IDS } from "@/lib/test-ids";
import type { CommandAction } from "./CommandPalette";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Command as CommandMenu,
} from "./ui/Command";
import { KeyboardShortcut, ShortcutHint } from "./ui/KeyboardShortcut";
import { Tabs, TabsList, TabsTrigger } from "./ui/Tabs";
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

function filterCommands(commands: CommandAction[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return commands.slice(0, 8);
  }

  return commands
    .filter((command) => {
      const haystack = [
        command.label,
        command.description,
        ...(command.keywords ?? []),
        command.group,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    })
    .slice(0, 8);
}

function groupCommands(commands: CommandAction[]) {
  return commands.reduce<Record<string, CommandAction[]>>((groups, command) => {
    const group = command.group ?? "Actions";
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(command);
    return groups;
  }, {});
}

function getFilteredResults(
  activeTab: "all" | "issues" | "documents",
  issueResults: Doc<"issues">[],
  documentResults: Doc<"documents">[],
): SearchResult[] {
  const issueSearchResults = issueResults.map((result) => ({ ...result, type: "issue" as const }));
  const documentSearchResults = documentResults.map((result) => ({
    ...result,
    type: "document" as const,
  }));

  if (activeTab === "all") {
    return [...issueSearchResults, ...documentSearchResults];
  }
  if (activeTab === "issues") {
    return issueSearchResults;
  }
  return documentSearchResults;
}

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

function CommandActionItem({ command, onClose }: { command: CommandAction; onClose: () => void }) {
  return (
    <CommandItem
      value={command.id}
      onSelect={() => {
        command.action();
        onClose();
      }}
      className="cursor-pointer data-[selected=true]:bg-ui-bg-secondary"
    >
      {command.icon ? <Icon icon={command.icon} size="md" className="mr-2" /> : null}
      <FlexItem flex="1">
        <Typography variant="label" as="p">
          {command.label}
        </Typography>
        {command.description ? (
          <Typography variant="caption">{command.description}</Typography>
        ) : null}
      </FlexItem>
      <ArrowRight className="h-4 w-4 text-ui-text-tertiary" />
    </CommandItem>
  );
}

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
        <Flex
          align="center"
          justify="center"
          className="h-8 w-8 shrink-0 rounded bg-ui-bg-tertiary"
        >
          {result.type === "issue" ? (
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-brand"
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
              className="h-5 w-5 text-accent"
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

        <FlexItem flex="1" className="min-w-0">
          <Flex align="center" gap="sm" wrap>
            {result.type === "issue" ? (
              <Typography variant="inlineCode">{result.key}</Typography>
            ) : null}
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

function SearchListContent({
  query,
  hasShortcuts,
  commandGroups,
  isLoading,
  filteredResults,
  hasMore,
  totalCount,
  onClose,
  onLoadMore,
  onOpenAdvancedSearch,
}: {
  query: string;
  hasShortcuts: boolean;
  commandGroups: Record<string, CommandAction[]>;
  isLoading: boolean;
  filteredResults: SearchResult[];
  hasMore: boolean;
  totalCount: number;
  onClose: () => void;
  onLoadMore: () => void;
  onOpenAdvancedSearch: () => void;
}) {
  const commandGroupEntries = Object.entries(commandGroups);

  if (query.length === 0) {
    return (
      <>
        {commandGroupEntries.map(([group, commands]) => (
          <CommandGroup key={group} heading={group}>
            {commands.map((command) => (
              <CommandActionItem key={command.id} command={command} onClose={onClose} />
            ))}
          </CommandGroup>
        ))}

        <Flex
          direction="column"
          align="center"
          className="border-t border-ui-border px-4 py-6 text-center text-ui-text-secondary"
        >
          <Command className="mb-3 h-8 w-8 rounded-full border border-ui-border/70 p-2 text-ui-text-tertiary" />
          <Typography variant="small">
            Search across issues and docs, or jump straight into common actions.
          </Typography>
        </Flex>
      </>
    );
  }

  if (query.length < 2) {
    return (
      <>
        {commandGroupEntries.map(([group, commands]) => (
          <CommandGroup key={group} heading={group}>
            {commands.map((command) => (
              <CommandActionItem key={command.id} command={command} onClose={onClose} />
            ))}
          </CommandGroup>
        ))}
        <Typography
          variant="small"
          color="secondary"
          className="px-4 py-5 text-center"
          data-testid={TEST_IDS.SEARCH.MIN_QUERY_MESSAGE}
        >
          {hasShortcuts
            ? "Add at least 2 non-shortcut characters to search issues and docs"
            : "Type at least 2 characters to search issues and docs"}
        </Typography>
      </>
    );
  }

  if (isLoading) {
    return (
      <Flex
        direction="column"
        align="center"
        className="py-8 text-ui-text-secondary"
        data-testid={TEST_IDS.SEARCH.LOADING_STATE}
      >
        <div className="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-ring border-t-transparent" />
        <Typography variant="small">Searching...</Typography>
      </Flex>
    );
  }

  const hasCommandMatches = commandGroupEntries.length > 0;
  const hasSearchMatches = filteredResults.length > 0;

  return (
    <>
      {commandGroupEntries.map(([group, commands]) => (
        <CommandGroup key={group} heading={group}>
          {commands.map((command) => (
            <CommandActionItem key={command.id} command={command} onClose={onClose} />
          ))}
        </CommandGroup>
      ))}

      {!hasSearchMatches ? (
        <Flex
          direction="column"
          align="center"
          data-testid={TEST_IDS.GLOBAL_SEARCH.NO_RESULTS}
          className="px-4 py-10 text-ui-text-secondary"
        >
          <div className="mb-4 rounded-full border border-ui-border/50 bg-ui-bg-soft p-3 shadow-soft">
            <Icon icon={Search} size="xl" />
          </div>
          <Typography variant="label">
            {hasCommandMatches ? "No issue or document results" : "No results found"}
          </Typography>
          <Button variant="ghost" size="sm" onClick={onOpenAdvancedSearch} className="mt-3">
            Open advanced search
          </Button>
        </Flex>
      ) : (
        <CommandGroup data-testid={TEST_IDS.SEARCH.RESULTS_GROUP} heading="Results">
          {filteredResults.map((result) => (
            <SearchResultItem key={result._id} result={result} onClose={onClose} />
          ))}
        </CommandGroup>
      )}

      {hasMore ? (
        <Flex className="border-t border-ui-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            className="w-full bg-brand-subtle text-brand hover:bg-brand-subtle/70"
          >
            Load More ({totalCount - filteredResults.length} remaining)
          </Button>
        </Flex>
      ) : null}
    </>
  );
}

/** Unified omnibox for searching issues/documents and executing app actions. */
export function GlobalSearch({ commands = [] }: { commands?: CommandAction[] }) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [shouldOpenAdvancedSearch, setShouldOpenAdvancedSearch] = useState(false);
  const { isOpen, setIsOpen } = useSearchKeyboard();
  const { query, setQuery, activeTab, setActiveTab, issueOffset, documentOffset, limit, loadMore } =
    useSearchPagination(isOpen);
  const parsedSearch = parseIssueSearchShortcuts(query);
  const effectiveQuery = parsedSearch.textQuery;
  const shouldSearch = effectiveQuery.length >= 2;
  const matchedCommands = filterCommands(commands, effectiveQuery);
  const commandGroups = groupCommands(matchedCommands);

  const issueSearchResult = useAuthenticatedQuery(
    api.issues.search,
    shouldSearch
      ? {
          query: effectiveQuery,
          limit,
          offset: issueOffset,
          ...parsedSearch.filters,
        }
      : "skip",
  );
  const documentSearchResult = useAuthenticatedQuery(
    api.documents.search,
    shouldSearch ? { query: effectiveQuery, limit, offset: documentOffset } : "skip",
  );

  const issueResults = issueSearchResult?.page ?? [];
  const documentResults = documentSearchResult?.results ?? [];
  const issueTotal = issueSearchResult?.total ?? 0;
  const documentTotal = documentSearchResult?.total ?? 0;
  const issueHasMore = (issueSearchResult?.page?.length ?? 0) === limit;
  const documentHasMore = documentSearchResult?.hasMore ?? false;
  const filteredResults = shouldSearch
    ? getFilteredResults(activeTab, issueResults, documentResults)
    : [];
  const totalCount = getTotalCount(activeTab, issueTotal, documentTotal);
  const hasMore = getHasMore(activeTab, issueHasMore, documentHasMore);
  const isLoading =
    shouldSearch && (issueSearchResult === undefined || documentSearchResult === undefined);

  const handleLoadMore = () => {
    loadMore(issueHasMore, documentHasMore);
  };

  const handleOpenAdvancedSearch = () => {
    setShouldOpenAdvancedSearch(true);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!shouldOpenAdvancedSearch || isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsAdvancedOpen(true);
      setShouldOpenAdvancedSearch(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen, shouldOpenAdvancedSearch]);

  const handleFocusOutside: NonNullable<ComponentProps<typeof CommandDialog>["onFocusOutside"]> = (
    event,
  ) => {
    event.preventDefault();
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        aria-label="Open search and commands"
        data-testid={TEST_IDS.HEADER.SEARCH_BUTTON}
        className="h-11 min-w-0 max-w-md flex-1 justify-between rounded-full border border-ui-border/50 bg-ui-bg-soft/70 px-3 text-ui-text-secondary shadow-soft backdrop-blur-sm transition-all duration-default hover:border-ui-border hover:bg-ui-bg-soft hover:text-ui-text"
      >
        <Flex align="center" gap="sm" className="min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ui-bg-secondary/70 text-ui-text-tertiary">
            <Search className="h-4 w-4" />
          </div>
          <Typography variant="small" color="secondary" className="truncate text-xs sm:text-sm">
            Search, jump, or create...
          </Typography>
        </Flex>
        <KeyboardShortcut shortcut="⌘+K" className="hidden shrink-0 sm:inline-flex" />
      </Button>

      <CommandDialog
        open={isOpen}
        onOpenChange={(open) => !open && setIsOpen(false)}
        onFocusOutside={handleFocusOutside}
        title="Search and commands"
        description="Find issues and documents, navigate the app, or run quick actions."
      >
        <CommandMenu
          data-testid={TEST_IDS.SEARCH.MODAL}
          className="bg-linear-to-b from-ui-bg to-ui-bg-secondary/80"
          shouldFilter={false}
        >
          <CommandInput
            placeholder="Search issues, docs, and commands..."
            value={query}
            onValueChange={setQuery}
            className="text-ui-text"
            data-testid={TEST_IDS.SEARCH.INPUT}
            aria-label="Search and commands"
          />

          {effectiveQuery.length >= 2 ? (
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "all" | "issues" | "documents")}
              className="overflow-x-auto border-b border-ui-border/50 bg-ui-bg-soft/30"
            >
              <TabsList variant="underline" className="gap-5 px-3">
                <TabsTrigger
                  value="all"
                  variant="underline"
                  className="px-1 pb-3 text-xs uppercase tracking-widest sm:text-sm"
                  data-testid={TEST_IDS.SEARCH.TAB_ALL}
                >
                  All ({issueTotal + documentTotal})
                </TabsTrigger>
                <TabsTrigger
                  value="issues"
                  variant="underline"
                  className="px-1 pb-3 text-xs uppercase tracking-widest sm:text-sm"
                  data-testid={TEST_IDS.SEARCH.TAB_ISSUES}
                >
                  Issues ({issueTotal})
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  variant="underline"
                  className="px-1 pb-3 text-xs uppercase tracking-widest sm:text-sm"
                  data-testid={TEST_IDS.SEARCH.TAB_DOCUMENTS}
                >
                  Documents ({documentTotal})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}

          <CommandList className="max-h-96 sm:max-h-screen">
            <CommandEmpty>No matches</CommandEmpty>
            <SearchListContent
              query={effectiveQuery}
              hasShortcuts={parsedSearch.hasShortcuts}
              commandGroups={commandGroups}
              isLoading={isLoading}
              filteredResults={filteredResults}
              hasMore={hasMore}
              totalCount={totalCount}
              onClose={() => setIsOpen(false)}
              onLoadMore={handleLoadMore}
              onOpenAdvancedSearch={handleOpenAdvancedSearch}
            />
          </CommandList>

          <Typography
            variant="meta"
            className="border-t border-ui-border/50 bg-ui-bg-soft/20 px-3 py-2 text-ui-text-tertiary"
          >
            Search filters: <code>type:bug</code> <code>status:done</code>{" "}
            <code>priority:high</code> <code>label:frontend</code> <code>@me</code>
          </Typography>

          <Flex
            align="center"
            justify="between"
            className="border-t border-ui-border/50 bg-ui-bg-soft/10 px-3 py-3"
          >
            <Flex align="center" gap="sm" wrap>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenAdvancedSearch}
                leftIcon={<Filter className="h-4 w-4" />}
                className="rounded-full border border-ui-border/40 bg-ui-bg-soft/60"
              >
                Advanced Search
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery("@")}
                leftIcon={<Plus className="h-4 w-4" />}
                className="rounded-full border border-ui-border/40 bg-ui-bg-soft/60"
              >
                Search with filters
              </Button>
            </Flex>
            <Flex align="center" gap="lg" className="hidden sm:flex">
              <ShortcutHint keys="up+down">Navigate</ShortcutHint>
              <ShortcutHint keys="Enter">Open</ShortcutHint>
              <ShortcutHint keys="Esc">Close</ShortcutHint>
            </Flex>
          </Flex>
        </CommandMenu>
      </CommandDialog>

      {isAdvancedOpen ? (
        <AdvancedSearchModal
          open={isAdvancedOpen}
          onOpenChange={setIsAdvancedOpen}
          onSelectIssue={(issueId, projectId) => {
            window.location.href = `/project/${projectId}?issue=${issueId}`;
          }}
        />
      ) : null}
    </>
  );
}
