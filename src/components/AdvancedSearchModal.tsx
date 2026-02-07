import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { Typography } from "@/components/ui/Typography";
import { IssueTypeIcon } from "./ui/IssueTypeIcon";
import { FilterCheckboxGroup } from "./AdvancedSearchModal/FilterCheckboxGroup";
import { SearchResultsList } from "./AdvancedSearchModal/SearchResultsList";
import { Button } from "./ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Flex } from "./ui/Flex";
import { Input } from "./ui/form";

interface AdvancedSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectIssue: (issueId: Id<"issues">) => void;
}

export function AdvancedSearchModal({
  open,
  onOpenChange,
  onSelectIssue,
}: AdvancedSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  // Reset offset when query or filters change
  useEffect(() => {
    setOffset(0);
  }, []);

  // Use server-side filtering
  const searchResult = useQuery(
    api.issues.search,
    searchQuery.length >= 2
      ? {
          query: searchQuery,
          limit: LIMIT,
          offset,
          type: selectedType.length > 0 ? selectedType : undefined,
          priority: selectedPriority.length > 0 ? selectedPriority : undefined,
          status: selectedStatus.length > 0 ? selectedStatus : undefined,
        }
      : "skip",
  );

  const results = searchResult?.page ?? [];
  const total = searchResult?.total ?? 0;
  const hasMore = (searchResult?.page?.length ?? 0) === LIMIT;

  const handleSelectIssue = useCallback(
    (issueId: Id<"issues">) => {
      onSelectIssue(issueId);
      onOpenChange(false);
      setSearchQuery("");
      setSelectedType([]);
      setSelectedPriority([]);
      setSelectedStatus([]);
      setOffset(0);
    },
    [onSelectIssue, onOpenChange],
  );

  const handleLoadMore = useCallback(() => {
    setOffset((prev) => prev + LIMIT);
  }, []);

  const toggleFilter = useCallback(
    (value: string, array: string[], setter: (arr: string[]) => void) => {
      if (array.includes(value)) {
        setter(array.filter((v) => v !== value));
      } else {
        setter([...array, value]);
      }
    },
    [],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="tracking-tight">Advanced Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Search Input */}
          <div>
            <Input
              label="Search Issues"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, key, or description..."
              autoFocus
              helperText="Type at least 2 characters to search"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FilterCheckboxGroup
              label="Type"
              options={["task", "bug", "story", "epic"]}
              selectedValues={selectedType}
              onToggle={(type) => toggleFilter(type, selectedType, setSelectedType)}
              renderLabel={(type) => (
                <Flex align="center" gap="xs">
                  <IssueTypeIcon type={type} size="sm" />
                  <span>{type}</span>
                </Flex>
              )}
            />

            <FilterCheckboxGroup
              label="Priority"
              options={["highest", "high", "medium", "low", "lowest"]}
              selectedValues={selectedPriority}
              onToggle={(priority) => toggleFilter(priority, selectedPriority, setSelectedPriority)}
            />

            <FilterCheckboxGroup
              label="Status"
              options={["todo", "in progress", "done", "blocked"]}
              selectedValues={selectedStatus}
              onToggle={(status) => toggleFilter(status, selectedStatus, setSelectedStatus)}
              maxHeight="max-h-40 overflow-y-auto"
            />
          </div>

          {/* Results */}
          <div>
            <Flex align="center" justify="between" className="mb-3">
              <Typography variant="h3" className="text-sm font-medium text-ui-text">
                Results {searchQuery.length >= 2 && `(${total} total, showing ${results.length})`}
              </Typography>
              {(selectedType.length > 0 ||
                selectedPriority.length > 0 ||
                selectedStatus.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType([]);
                    setSelectedPriority([]);
                    setSelectedStatus([]);
                  }}
                  className="text-sm text-brand hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </Flex>

            <div className="border border-ui-border rounded-lg overflow-hidden">
              <SearchResultsList
                searchQuery={searchQuery}
                results={results}
                total={total}
                hasMore={hasMore}
                onSelectIssue={handleSelectIssue}
                onLoadMore={handleLoadMore}
              />
            </div>
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} variant="secondary">
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
