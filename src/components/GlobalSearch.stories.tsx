import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Search } from "@/lib/icons";
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
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { ShortcutHint } from "./ui/KeyboardShortcut";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface SearchResult {
  id: string;
  title: string;
  key?: string;
  description?: string;
  type: "issue" | "document";
}

// =============================================================================
// Presentational Components
// =============================================================================

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

function SearchResultItem({ result, onSelect }: { result: SearchResult; onSelect: () => void }) {
  return (
    <CommandItem
      value={result.id}
      onSelect={onSelect}
      className="p-3 sm:p-4 cursor-pointer data-[selected=true]:bg-ui-bg-secondary"
    >
      <Flex align="start" gap="md" className="w-full">
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

        <FlexItem flex="1" className="min-w-0">
          <Flex align="center" gap="sm" wrap>
            {result.type === "issue" && result.key && (
              <code className="font-mono text-sm">{result.key}</code>
            )}
            <Badge variant="neutral" shape="pill">
              {result.type}
            </Badge>
          </Flex>
          <Typography variant="p" className="mt-1 font-medium truncate">
            {result.title}
          </Typography>
          {result.description && (
            <Typography variant="small" color="secondary" className="truncate mt-0.5">
              {result.description}
            </Typography>
          )}
        </FlexItem>
      </Flex>
    </CommandItem>
  );
}

interface GlobalSearchPresentationalProps {
  isOpen: boolean;
  onClose: () => void;
  results?: SearchResult[];
  isLoading?: boolean;
  activeTab?: "all" | "issues" | "documents";
  initialQuery?: string;
  hasMore?: boolean;
  totalCount?: number;
}

function GlobalSearchPresentational({
  isOpen,
  onClose,
  results = [],
  isLoading = false,
  activeTab: initialTab = "all",
  initialQuery = "",
  hasMore = false,
  totalCount = 0,
}: GlobalSearchPresentationalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialTab);

  const filteredResults = results.filter((r) => {
    if (activeTab === "all") return true;
    return r.type === activeTab.slice(0, -1); // "issues" -> "issue"
  });

  const issueCount = results.filter((r) => r.type === "issue").length;
  const documentCount = results.filter((r) => r.type === "document").length;

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Command className="bg-ui-bg">
        <div className="relative">
          <CommandInput
            placeholder="Search issues, documents..."
            value={query}
            onValueChange={setQuery}
            className="text-ui-text"
          />
        </div>

        {/* Tabs */}
        <Flex gap="md" className="px-4 py-2 border-b border-ui-border">
          <SearchTab
            label="All"
            isActive={activeTab === "all"}
            count={issueCount + documentCount}
            showCount={query.length >= 2}
            onClick={() => setActiveTab("all")}
          />
          <SearchTab
            label="Issues"
            isActive={activeTab === "issues"}
            count={issueCount}
            showCount={query.length >= 2}
            onClick={() => setActiveTab("issues")}
          />
          <SearchTab
            label="Documents"
            isActive={activeTab === "documents"}
            count={documentCount}
            showCount={query.length >= 2}
            onClick={() => setActiveTab("documents")}
          />
        </Flex>

        <CommandList className="max-h-panel-sm sm:max-h-panel-md">
          {query.length < 2 ? (
            <Typography variant="small" color="secondary" className="p-8 text-center">
              Type at least 2 characters to search
            </Typography>
          ) : isLoading ? (
            <div className="p-8 text-center text-ui-text-secondary">
              <div className="inline-block w-6 h-6 border-2 border-brand-ring border-t-transparent rounded-full animate-spin mb-2" />
              <Typography variant="p" className="text-sm">
                Searching...
              </Typography>
            </div>
          ) : (
            <>
              <CommandEmpty className="p-8">
                <div className="text-center">
                  <Icon icon={Search} size="xl" className="mx-auto mb-4" />
                  <Typography variant="p" className="font-medium text-ui-text">
                    No results found
                  </Typography>
                </div>
              </CommandEmpty>
              {filteredResults.length > 0 && (
                <CommandGroup>
                  {filteredResults.map((result) => (
                    <SearchResultItem key={result.id} result={result} onSelect={() => onClose()} />
                  ))}
                </CommandGroup>
              )}
              {hasMore && (
                <div className="p-4 border-t border-ui-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                    className="w-full text-brand bg-brand-subtle hover:bg-brand-subtle"
                  >
                    Load More ({totalCount - filteredResults.length} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </CommandList>

        {/* Footer shortcuts */}
        <Flex
          wrap
          gap="md"
          className="px-4 py-2 border-t border-ui-border bg-ui-bg-secondary text-xs text-ui-text-tertiary sm:gap-4"
        >
          <ShortcutHint keys="up+down">Navigate</ShortcutHint>
          <ShortcutHint keys="Enter">Open</ShortcutHint>
          <ShortcutHint keys="Esc">Close</ShortcutHint>
        </Flex>
      </Command>
    </CommandDialog>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockIssueResults: SearchResult[] = [
  {
    id: "issue-1",
    title: "Fix login button alignment on mobile",
    key: "FE-123",
    description: "The login button is misaligned on smaller screens",
    type: "issue",
  },
  {
    id: "issue-2",
    title: "Add user avatar component",
    key: "FE-124",
    description: "Create reusable avatar component with fallback",
    type: "issue",
  },
  {
    id: "issue-3",
    title: "Implement caching layer for API responses",
    key: "BE-89",
    description: "Add Redis caching to reduce database load",
    type: "issue",
  },
  {
    id: "issue-4",
    title: "Update dependencies to latest versions",
    key: "DEV-45",
    description: "Security updates for npm packages",
    type: "issue",
  },
];

const mockDocumentResults: SearchResult[] = [
  {
    id: "doc-1",
    title: "API Documentation",
    description: "REST API endpoints and usage examples",
    type: "document",
  },
  {
    id: "doc-2",
    title: "Onboarding Guide",
    description: "New team member onboarding checklist",
    type: "document",
  },
  {
    id: "doc-3",
    title: "Architecture Decision Records",
    description: "Technical decisions and rationale",
    type: "document",
  },
];

const allResults = [...mockIssueResults, ...mockDocumentResults];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof GlobalSearchPresentational> = {
  title: "Components/GlobalSearch",
  component: GlobalSearchPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A global search dialog for finding issues and documents. Supports tabbed filtering, pagination, and keyboard navigation.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    results: allResults,
    initialQuery: "api",
  },
  parameters: {
    docs: {
      description: {
        story: "Global search with results showing both issues and documents.",
      },
    },
  },
};

export const EmptyQuery: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    results: [],
    initialQuery: "",
  },
  parameters: {
    docs: {
      description: {
        story: "Initial state prompting user to type at least 2 characters.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    results: [],
    isLoading: true,
    initialQuery: "test",
  },
  parameters: {
    docs: {
      description: {
        story: "Search in progress with loading spinner.",
      },
    },
  },
};

export const NoResults: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    results: [],
    initialQuery: "xyz123nonexistent",
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state when no results match the query.",
      },
    },
  },
};

export const IssuesOnly: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    results: mockIssueResults,
    initialQuery: "fix",
    activeTab: "issues",
  },
  parameters: {
    docs: {
      description: {
        story: "Search filtered to show only issues.",
      },
    },
  },
};

export const DocumentsOnly: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    results: mockDocumentResults,
    initialQuery: "guide",
    activeTab: "documents",
  },
  parameters: {
    docs: {
      description: {
        story: "Search filtered to show only documents.",
      },
    },
  },
};

export const WithPagination: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    results: allResults,
    initialQuery: "test",
    hasMore: true,
    totalCount: 25,
  },
  parameters: {
    docs: {
      description: {
        story: "Search results with pagination showing more results available.",
      },
    },
  },
};

export const ManyResults: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    results: [
      ...mockIssueResults,
      ...mockIssueResults.map((r) => ({ ...r, id: `${r.id}-2`, key: r.key?.replace("-", "-2") })),
      ...mockDocumentResults,
    ],
    initialQuery: "project",
  },
  parameters: {
    docs: {
      description: {
        story: "Search with many results demonstrating scrolling.",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <Typography variant="p" className="mb-4 text-center">
          Click the button or press{" "}
          <kbd className="px-2 py-1 bg-ui-bg-secondary rounded">Cmd/Ctrl + K</kbd> to open
        </Typography>
        <Flex justify="center">
          <Button onClick={() => setIsOpen(true)} leftIcon={<Icon icon={Search} size="sm" />}>
            Search
          </Button>
        </Flex>
        <GlobalSearchPresentational
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          results={allResults}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo where you can open and use the search dialog.",
      },
    },
  },
};
