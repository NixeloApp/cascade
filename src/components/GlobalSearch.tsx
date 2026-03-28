/**
 * Global Search
 *
 * Unified omnibox for search, navigation, and quick actions.
 * Supports keyboard navigation, type filtering, and advanced search handoff.
 * Opens with Cmd+K shortcut and provides paginated results plus command actions.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { type ComponentProps, type ReactNode, useEffect, useState } from "react";
import { AdvancedSearchModal } from "@/components/AdvancedSearchModal";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useSearchKeyboard, useSearchPagination } from "@/hooks/useGlobalSearch";
import { useOrganization } from "@/hooks/useOrgContext";
import { ArrowRight, Command, Filter, Plus, Search } from "@/lib/icons";
import { parseIssueSearchShortcuts } from "@/lib/search-shortcuts";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import type { CommandAction } from "./CommandPalette";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, getCardRecipeClassName } from "./ui/Card";
import {
  CommandDialog,
  type CommandItemConfig,
  Command as CommandMenu,
  type CommandSection,
} from "./ui/Command";
import { KeyboardShortcut, ShortcutHint } from "./ui/KeyboardShortcut";
import { LoadingSpinner } from "./ui/LoadingSpinner";
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

function SearchRowIconShell({
  children,
  className,
  padding = "none",
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  padding?: ComponentProps<typeof Card>["padding"];
  tone?: "default" | "muted";
}) {
  return (
    <Card
      recipe="controlStrip"
      padding={padding}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center",
        tone === "muted" ? "text-ui-text-tertiary" : undefined,
        className,
      )}
    >
      {children}
    </Card>
  );
}

function createSearchListRow({
  description,
  icon,
  meta,
  onSelect,
  trailingAlign = "center",
  title,
  trailing,
  value,
  testId,
}: {
  description?: ReactNode;
  icon: ReactNode;
  meta?: ReactNode;
  onSelect: () => void;
  trailingAlign?: "start" | "center";
  title: ReactNode;
  trailing?: ReactNode;
  value: string;
  testId?: string;
}): CommandItemConfig {
  return {
    className: "cursor-pointer data-[selected=true]:bg-ui-bg-secondary",
    onSelect: () => onSelect(),
    render: (
      <Flex align="start" gap="md" className="w-full">
        {icon}
        <FlexItem flex="1" className="min-w-0">
          {meta ? (
            <Flex align="center" gap="sm" wrap>
              {meta}
            </Flex>
          ) : null}
          <Typography variant="label" as="p" className={cn(meta ? "mt-1.5 truncate" : "truncate")}>
            {title}
          </Typography>
          {description ? (
            <Typography variant={meta ? "meta" : "caption"} className="mt-1 line-clamp-2">
              {description}
            </Typography>
          ) : null}
        </FlexItem>
        {trailing ? (
          <Flex align={trailingAlign} className="self-stretch shrink-0">
            {trailing}
          </Flex>
        ) : null}
      </Flex>
    ),
    testId,
    value,
  };
}

function SearchResultGlyph({ type }: { type: SearchResult["type"] }) {
  if (type === "issue") {
    return (
      <svg aria-hidden="true" className="size-5 text-brand" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SearchIntroPanel() {
  return (
    <div className="px-2 pt-2">
      <div className={cn(getCardRecipeClassName("commandIntro"), "p-3")}>
        <Flex direction="column" gap="md">
          <div>
            <Badge variant="brand" shape="pill">
              Command center
            </Badge>
            <Typography variant="h5" className="mt-3">
              Jump faster across your workspace
            </Typography>
            <Typography variant="small" color="secondary" className="mt-2">
              Search issues and docs as you type, or use the quick actions below to navigate and
              create without leaving your flow.
            </Typography>
          </div>
          <Flex gap="sm" wrap>
            <Badge variant="outline" shape="pill">
              Navigate
            </Badge>
            <Badge variant="outline" shape="pill">
              Create
            </Badge>
            <Badge variant="outline" shape="pill">
              Search with filters
            </Badge>
          </Flex>
        </Flex>
      </div>
    </div>
  );
}

function SearchInfoPanel({ children }: { children: ReactNode }) {
  return (
    <Card
      variant="ghost"
      padding="md"
      radius="none"
      className="border-t border-ui-border text-center text-ui-text-secondary"
    >
      <Flex direction="column" align="center">
        {children}
      </Flex>
    </Card>
  );
}

function SearchEmptyState({
  hasCommandMatches,
  onOpenAdvancedSearch,
}: {
  hasCommandMatches: boolean;
  onOpenAdvancedSearch: () => void;
}) {
  return (
    <Flex
      direction="column"
      align="center"
      data-testid={TEST_IDS.GLOBAL_SEARCH.NO_RESULTS}
      className="text-ui-text-secondary"
    >
      <div className="p-4">
        <Flex direction="column" align="center" gap="md">
          <SearchRowIconShell padding="xs" tone="muted">
            <Icon icon={Search} size="xl" />
          </SearchRowIconShell>
          <Typography variant="label">
            {hasCommandMatches ? "No issue or document results" : "No results found"}
          </Typography>
          <Button variant="ghost" size="sm" onClick={onOpenAdvancedSearch}>
            Open advanced search
          </Button>
        </Flex>
      </div>
    </Flex>
  );
}

function SearchFooter({
  onOpenAdvancedSearch,
  onSearchWithFilters,
}: {
  onOpenAdvancedSearch: () => void;
  onSearchWithFilters: () => void;
}) {
  return (
    <Card
      variant="ghost"
      padding="md"
      radius="none"
      className="shrink-0 border-t border-ui-border/50 bg-ui-bg-soft/20"
    >
      <Stack gap="sm">
        <Flex align="center" justify="between">
          <Flex align="center" gap="sm" wrap>
            <Button
              chrome="framed"
              chromeSize="compactPill"
              onClick={onOpenAdvancedSearch}
              leftIcon={<Icon icon={Filter} size="sm" />}
            >
              Advanced Search
            </Button>
            <Button
              chrome="framed"
              chromeSize="compactPill"
              onClick={onSearchWithFilters}
              leftIcon={<Icon icon={Plus} size="sm" />}
            >
              Search with filters
            </Button>
          </Flex>
          <div className="hidden sm:block">
            <Flex align="center" gap="lg">
              <ShortcutHint keys="up+down">Navigate</ShortcutHint>
              <ShortcutHint keys="Enter">Open</ShortcutHint>
              <ShortcutHint keys="Esc">Close</ShortcutHint>
            </Flex>
          </div>
        </Flex>
        <Typography variant="meta" className="hidden text-ui-text-tertiary sm:block">
          Filters: <code>type:bug</code> <code>status:done</code> <code>priority:high</code>{" "}
          <code>label:frontend</code> <code>@me</code>
        </Typography>
      </Stack>
    </Card>
  );
}

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

function buildCommandActionItem(command: CommandAction, onClose: () => void): CommandItemConfig {
  return createSearchListRow({
    value: command.id,
    onSelect: () => {
      command.action();
      onClose();
    },
    icon: (
      <SearchRowIconShell tone="muted">
        {command.icon ? <Icon icon={command.icon} size="md" /> : <Icon icon={Command} size="sm" />}
      </SearchRowIconShell>
    ),
    title: command.label,
    trailingAlign: "start",
    meta: command.group ? (
      <Badge variant="outline" shape="pill">
        {command.group}
      </Badge>
    ) : undefined,
    description: command.description,
    trailing: <Icon icon={ArrowRight} size="sm" tone="tertiary" />,
  });
}

function buildSearchResultItem({
  onClose,
  orgSlug,
  result,
}: {
  onClose: () => void;
  orgSlug: string;
  result: SearchResult;
}): CommandItemConfig {
  const href =
    result.type === "issue"
      ? ROUTES.issues.detail.build(orgSlug, result.key)
      : ROUTES.documents.detail.build(orgSlug, result._id);

  return createSearchListRow({
    value: result._id,
    onSelect: () => {
      window.location.href = href;
      onClose();
    },
    testId: TEST_IDS.SEARCH.RESULT_ITEM,
    icon: (
      <SearchRowIconShell>
        <SearchResultGlyph type={result.type} />
      </SearchRowIconShell>
    ),
    meta: (
      <>
        {result.type === "issue" ? (
          <Typography variant="inlineCode">{result.key}</Typography>
        ) : null}
        <Badge variant="neutral" shape="pill" data-testid={TEST_IDS.SEARCH.RESULT_TYPE}>
          {result.type}
        </Badge>
      </>
    ),
    title: result.title,
    description: result.description || "No description",
  });
}

function buildCommandSections(
  commandGroups: Record<string, CommandAction[]>,
  onClose: () => void,
): CommandSection[] {
  return Object.entries(commandGroups).map(([group, commands]) => ({
    id: `commands-${group}`,
    heading: group,
    items: commands.map((command) => buildCommandActionItem(command, onClose)),
  }));
}

function buildSearchSections({
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
  orgSlug,
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
  orgSlug: string;
}): CommandSection[] {
  const commandSections = buildCommandSections(commandGroups, onClose);

  if (query.length === 0) {
    return [
      { type: "content", id: "intro", content: <SearchIntroPanel /> },
      ...commandSections,
      {
        type: "content",
        id: "intro-info",
        content: (
          <SearchInfoPanel>
            <Typography variant="small">
              Search across issues and docs, or jump straight into common actions.
            </Typography>
          </SearchInfoPanel>
        ),
      },
    ];
  }

  if (query.length < 2) {
    return [
      ...commandSections,
      {
        type: "content",
        id: "min-query-info",
        content: (
          <SearchInfoPanel>
            <Typography
              variant="small"
              color="secondary"
              data-testid={TEST_IDS.SEARCH.MIN_QUERY_MESSAGE}
            >
              {hasShortcuts
                ? "Add at least 2 non-shortcut characters to search issues and docs"
                : "Type at least 2 characters to search issues and docs"}
            </Typography>
          </SearchInfoPanel>
        ),
      },
    ];
  }

  if (isLoading) {
    return [
      {
        type: "content",
        id: "loading",
        content: (
          <Flex
            direction="column"
            align="center"
            className="text-ui-text-secondary"
            data-testid={TEST_IDS.SEARCH.LOADING_STATE}
          >
            <SearchInfoPanel>
              <LoadingSpinner size="md" variant="brand" message="Searching..." />
            </SearchInfoPanel>
          </Flex>
        ),
      },
    ];
  }

  const hasCommandMatches = commandSections.length > 0;
  const hasSearchMatches = filteredResults.length > 0;

  return [
    ...commandSections,
    !hasSearchMatches
      ? {
          type: "content" as const,
          id: "no-results",
          content: (
            <SearchEmptyState
              hasCommandMatches={hasCommandMatches}
              onOpenAdvancedSearch={onOpenAdvancedSearch}
            />
          ),
        }
      : {
          id: "results",
          heading: "Results",
          items: filteredResults.map((result) =>
            buildSearchResultItem({ result, onClose, orgSlug }),
          ),
          testId: TEST_IDS.SEARCH.RESULTS_GROUP,
        },
    ...(hasMore
      ? [
          {
            type: "content" as const,
            id: "load-more",
            content: (
              <SearchInfoPanel>
                <Button variant="brandSubtle" size="sm" onClick={onLoadMore} className="w-full">
                  Load More ({totalCount - filteredResults.length} remaining)
                </Button>
              </SearchInfoPanel>
            ),
          },
        ]
      : []),
  ];
}

/** Unified omnibox for searching issues/documents and executing app actions. */
export function GlobalSearch({ commands = [] }: { commands?: CommandAction[] }) {
  const { orgSlug } = useOrganization();
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
  const searchSections = buildSearchSections({
    query: effectiveQuery,
    hasShortcuts: parsedSearch.hasShortcuts,
    commandGroups,
    isLoading,
    filteredResults,
    hasMore,
    totalCount,
    onClose: () => setIsOpen(false),
    onLoadMore: handleLoadMore,
    onOpenAdvancedSearch: handleOpenAdvancedSearch,
    orgSlug,
  });

  return (
    <>
      <Button
        chrome="framed"
        chromeSize="searchTrigger"
        onClick={() => {
          setShouldOpenAdvancedSearch(false); // Reset handoff flag to prevent stale state
          setIsOpen(true);
        }}
        aria-label="Open search and commands"
        data-testid={TEST_IDS.HEADER.SEARCH_BUTTON}
      >
        <Flex align="center" gap="sm" className="min-w-0">
          <SearchRowIconShell className="border-ui-border/60 sm:size-7" tone="muted">
            <Icon icon={Search} size="sm" />
          </SearchRowIconShell>
          <Typography variant="small" color="secondary" className="hidden truncate sm:block">
            Search, jump, or create...
          </Typography>
        </Flex>
        <FlexItem shrink={false} className="hidden sm:block">
          <KeyboardShortcut shortcut="⌘+K" />
        </FlexItem>
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
          footer={
            <SearchFooter
              onOpenAdvancedSearch={handleOpenAdvancedSearch}
              onSearchWithFilters={() => setQuery("@")}
            />
          }
          header={
            effectiveQuery.length >= 2 ? (
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "all" | "issues" | "documents")}
                className="shrink-0"
              >
                <Card
                  variant="ghost"
                  padding="none"
                  radius="none"
                  className="border-b border-ui-border/50 bg-ui-bg-soft/30"
                >
                  <TabsList variant="underline" className="gap-5 px-3">
                    <TabsTrigger
                      value="all"
                      variant="underline"
                      size="underlineCompact"
                      data-testid={TEST_IDS.SEARCH.TAB_ALL}
                    >
                      All ({issueTotal + documentTotal})
                    </TabsTrigger>
                    <TabsTrigger
                      value="issues"
                      variant="underline"
                      size="underlineCompact"
                      data-testid={TEST_IDS.SEARCH.TAB_ISSUES}
                    >
                      Issues ({issueTotal})
                    </TabsTrigger>
                    <TabsTrigger
                      value="documents"
                      variant="underline"
                      size="underlineCompact"
                      data-testid={TEST_IDS.SEARCH.TAB_DOCUMENTS}
                    >
                      Documents ({documentTotal})
                    </TabsTrigger>
                  </TabsList>
                </Card>
              </Tabs>
            ) : null
          }
          search={{
            placeholder: "Search issues, docs, and commands...",
            value: query,
            onValueChange: setQuery,
            className: "shrink-0 text-ui-text",
            testId: TEST_IDS.SEARCH.INPUT,
            ariaLabel: "Search and commands",
          }}
          sections={searchSections}
          shouldFilter={false}
        />
      </CommandDialog>

      {isAdvancedOpen ? (
        <AdvancedSearchModal
          open={isAdvancedOpen}
          onOpenChange={setIsAdvancedOpen}
          onSelectIssue={(issueKey) => {
            window.location.href = ROUTES.issues.detail.build(orgSlug, issueKey);
          }}
        />
      ) : null}
    </>
  );
}
