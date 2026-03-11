/**
 * Advanced Search Modal
 *
 * Full-featured search dialog with filters for issues and documents.
 * Supports filtering by type, priority, status, assignee, and labels.
 * Shows results in categorized sections with navigation.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ISSUE_PRIORITIES, ISSUE_TYPES } from "@convex/validators";
import { useState } from "react";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";
import { FilterCheckboxGroup } from "./AdvancedSearchModal/FilterCheckboxGroup";
import { SearchResultsList } from "./AdvancedSearchModal/SearchResultsList";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Flex } from "./ui/Flex";
import { Input } from "./ui/form";
import { Grid } from "./ui/Grid";
import { Icon } from "./ui/Icon";
import { Stack } from "./ui/Stack";
import { chromeButtonVariants, surfaceRecipeVariants } from "./ui/surfaceRecipes";

interface AdvancedSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectIssue: (issueId: Id<"issues">, projectId: Id<"projects">) => void;
}

/**
 * Modal for advanced issue search with type, priority, and status filters.
 */
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

  // Use server-side filtering
  const searchResult = useAuthenticatedQuery(
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

  const handleSelectIssue = (issueId: Id<"issues">, projectId: Id<"projects">) => {
    onSelectIssue(issueId, projectId);
    onOpenChange(false);
    setSearchQuery("");
    setSelectedType([]);
    setSelectedPriority([]);
    setSelectedStatus([]);
    setOffset(0);
  };

  const handleLoadMore = () => {
    setOffset((prev) => prev + LIMIT);
  };

  const toggleFilter = (value: string, array: string[], setter: (arr: string[]) => void) => {
    setOffset(0);
    if (array.includes(value)) {
      setter(array.filter((v) => v !== value));
    } else {
      setter([...array, value]);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Advanced Search"
      description="Search issues by text, then narrow the result set with a few precise filters."
      size="lg"
      data-testid={TEST_IDS.SEARCH.ADVANCED_MODAL}
      footer={
        <Button
          onClick={() => onOpenChange(false)}
          variant="secondary"
          className={chromeButtonVariants({ tone: "framed", size: "compactPill" })}
        >
          Close
        </Button>
      }
    >
      <Stack gap="lg">
        <div className={surfaceRecipeVariants({ recipe: "overlayInset" })}>
          <Stack gap="xs" className="p-4">
            <Typography variant="label" className="uppercase tracking-wider text-ui-text-tertiary">
              Search playbook
            </Typography>
            <Typography variant="small" color="secondary">
              Start with a title, issue key, or problem phrase. Add filters only when you need to
              cut a large result set down.
            </Typography>
          </Stack>
        </div>

        {/* Search Input */}
        <Input
          label="Search Issues"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setOffset(0);
          }}
          placeholder="Search by title, key, or description..."
          autoFocus
          helperText="Type at least 2 characters to search"
        />

        {/* Filters */}
        <Grid cols={1} colsMd={3} gap="lg">
          <FilterCheckboxGroup
            label="Type"
            options={ISSUE_TYPES}
            selectedValues={selectedType}
            onToggle={(type) => toggleFilter(type, selectedType, setSelectedType)}
            renderLabel={(type) => (
              <Flex align="center" gap="xs" as="span">
                <Icon icon={ISSUE_TYPE_ICONS[type]} size="sm" />
                <span>{type}</span>
              </Flex>
            )}
          />

          <FilterCheckboxGroup
            label="Priority"
            options={ISSUE_PRIORITIES}
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
        </Grid>

        {/* Results */}
        {searchQuery.length >= 2 ? (
          <Stack gap="sm">
            <Flex align="center" justify="between">
              <Typography
                variant="label"
                className="uppercase tracking-wider text-ui-text-tertiary"
              >
                Results ({total} total, showing {results.length})
              </Typography>
              {(selectedType.length > 0 ||
                selectedPriority.length > 0 ||
                selectedStatus.length > 0) && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSelectedType([]);
                    setSelectedPriority([]);
                    setSelectedStatus([]);
                    setOffset(0);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Flex>

            <div className={surfaceRecipeVariants({ recipe: "overlayInset" })}>
              <SearchResultsList
                searchQuery={searchQuery}
                results={results}
                total={total}
                hasMore={hasMore}
                onSelectIssue={handleSelectIssue}
                onLoadMore={handleLoadMore}
              />
            </div>
          </Stack>
        ) : (
          <div className={surfaceRecipeVariants({ recipe: "overlayInset" })}>
            <Typography variant="small" color="secondary" className="px-4 py-4">
              Results appear once you type at least 2 characters.
            </Typography>
          </div>
        )}
      </Stack>
    </Dialog>
  );
}
