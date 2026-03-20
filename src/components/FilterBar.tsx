/**
 * Filter Bar
 *
 * Multi-criteria filter interface for issue lists and boards.
 * Supports filtering by type, priority, assignee, sprint, labels, and custom fields.
 * Includes saved filter presets and quick filter toggles.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { ISSUE_PRIORITIES, ISSUE_TYPES } from "@convex/validators";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { ChevronDown, Circle, X } from "@/lib/icons";
import { ISSUE_TYPE_ICONS, type IssuePriority, type IssueType } from "@/lib/issue-utils";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Dialog } from "./ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { Flex, FlexItem } from "./ui/Flex";
import { Checkbox, Input as FormInput } from "./ui/form";
import { Icon } from "./ui/Icon";
import { IconButton } from "./ui/IconButton";
import { Input } from "./ui/Input";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";
export interface DateRangeFilter {
  from?: string; // ISO date string (YYYY-MM-DD)
  to?: string;
}

export interface BoardFilters {
  query?: string;
  type?: Exclude<IssueType, "subtask">[];
  priority?: IssuePriority[];
  assigneeId?: Id<"users">[];
  labels?: string[];
  dueDate?: DateRangeFilter;
  startDate?: DateRangeFilter;
  createdAt?: DateRangeFilter;
}

interface FilterBarProps {
  projectId: Id<"projects">;
  filters: BoardFilters;
  onFilterChange: (filters: BoardFilters) => void;
}

const PRIORITIES_DISPLAY_ORDER = [...ISSUE_PRIORITIES].reverse();

/** Check if a date range filter has any values */
function hasDateRange(range?: DateRangeFilter): boolean {
  return !!(range?.from || range?.to);
}

/** Count total active filters across all filter types */
function countActiveFilters(filters: BoardFilters): number {
  return (
    (filters.query?.trim() ? 1 : 0) +
    (filters.type?.length ?? 0) +
    (filters.priority?.length ?? 0) +
    (filters.assigneeId?.length ?? 0) +
    (filters.labels?.length ?? 0) +
    (hasDateRange(filters.dueDate) ? 1 : 0) +
    (hasDateRange(filters.startDate) ? 1 : 0) +
    (hasDateRange(filters.createdAt) ? 1 : 0)
  );
}

/** Reusable filter dropdown to reduce component complexity */
interface FilterDropdownProps<T> {
  label: string;
  shortLabel?: string;
  activeCount: number;
  items: readonly T[] | T[] | undefined;
  selectedValues: T[] | undefined;
  onToggle: (value: T) => void;
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
  emptyMessage?: string;
  scrollable?: boolean;
}

function FilterDropdown<T>({
  label,
  shortLabel,
  activeCount,
  items,
  selectedValues,
  onToggle,
  renderItem,
  getKey,
  emptyMessage = "No items",
  scrollable = false,
}: FilterDropdownProps<T>) {
  const isActive = activeCount > 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button chrome={isActive ? "filterActive" : "filter"} chromeSize="filterPill">
          <span className="sm:hidden">{shortLabel ?? label}</span>
          <span className="hidden sm:inline">{label}</span>
          {isActive && ` (${activeCount})`}
          <ChevronDown className="ml-1 w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={cn(scrollable && "max-h-64 overflow-y-auto")}>
        {items?.map((item) => (
          <DropdownMenuCheckboxItem
            key={getKey(item)}
            checked={selectedValues?.includes(item) ?? false}
            onCheckedChange={() => onToggle(item)}
          >
            {renderItem(item)}
          </DropdownMenuCheckboxItem>
        ))}
        {(!items || items.length === 0) && (
          <Card padding="xs" radius="none" variant="ghost">
            <Typography variant="small" color="secondary">
              {emptyMessage}
            </Typography>
          </Card>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Date range filter dropdown component */
interface DateRangeDropdownProps {
  label: string;
  shortLabel?: string;
  value?: DateRangeFilter;
  onChange: (value: DateRangeFilter | undefined) => void;
}

function DateRangeDropdown({ label, shortLabel, value, onChange }: DateRangeDropdownProps) {
  const isActive = hasDateRange(value);

  const handleFromChange = (from: string) => {
    const newValue = { ...value, from: from || undefined };
    onChange(hasDateRange(newValue) ? newValue : undefined);
  };

  const handleToChange = (to: string) => {
    const newValue = { ...value, to: to || undefined };
    onChange(hasDateRange(newValue) ? newValue : undefined);
  };

  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button chrome={isActive ? "filterActive" : "filter"} chromeSize="filterPill">
          <span className="sm:hidden">{shortLabel ?? label}</span>
          <span className="hidden sm:inline">{label}</span>
          {isActive && " (1)"}
          <ChevronDown className="ml-1 w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <Card padding="sm" radius="none" variant="ghost">
          <Stack gap="sm">
            <FormInput
              label="From"
              type="date"
              value={value?.from ?? ""}
              onChange={(e) => handleFromChange(e.target.value)}
            />
            <FormInput
              label="To"
              type="date"
              value={value?.to ?? ""}
              onChange={(e) => handleToChange(e.target.value)}
            />
            {isActive && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="w-full">
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </Stack>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Enriched saved filter type from API (includes computed isOwner) */
type EnrichedSavedFilter = Doc<"savedFilters"> & { isOwner: boolean };

/** Saved filters dropdown component */
interface SavedFiltersDropdownProps {
  savedFilters: EnrichedSavedFilter[];
  onLoadFilter: (filter: EnrichedSavedFilter) => void;
  onDeleteFilter: (id: Id<"savedFilters">) => void;
}

function SavedFiltersDropdown({
  savedFilters,
  onLoadFilter,
  onDeleteFilter,
}: SavedFiltersDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button chrome="filter" chromeSize="filterPill">
          <span className="sm:hidden">Saved</span>
          <span className="hidden sm:inline">Saved Filters</span> ({savedFilters.length})
          <ChevronDown className="ml-1 w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto min-w-48">
        {savedFilters.map((filter) => (
          <DropdownMenuItem key={filter._id} onSelect={() => onLoadFilter(filter)}>
            <Flex align="center" justify="between" className="w-full">
              <FlexItem flex="1" className="min-w-0">
                <Stack gap="none" className="min-w-0">
                  <Typography variant="small" className="truncate">
                    {filter.name}
                  </Typography>
                  {filter.isPublic && (
                    <Typography variant="caption" color="tertiary">
                      Public
                    </Typography>
                  )}
                </Stack>
              </FlexItem>
              {filter.isOwner && (
                <IconButton
                  variant="danger"
                  size="xs"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFilter(filter._id);
                  }}
                  aria-label="Delete filter"
                >
                  <X className="w-3 h-3" />
                </IconButton>
              )}
            </Flex>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Save filter dialog component */
interface SaveFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterName: string;
  onFilterNameChange: (name: string) => void;
  isPublic: boolean;
  onIsPublicChange: (isPublic: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

function SaveFilterDialog({
  open,
  onOpenChange,
  filterName,
  onFilterNameChange,
  isPublic,
  onIsPublicChange,
  onSave,
  onCancel,
}: SaveFilterDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Save Filter"
      description="Save current filter settings"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </>
      }
    >
      <Stack gap="md">
        <FormInput
          label="Filter Name"
          type="text"
          value={filterName}
          onChange={(e) => onFilterNameChange(e.target.value)}
          placeholder="e.g., High Priority Bugs"
        />
        <Checkbox
          label="Share with team (make public)"
          checked={isPublic}
          onChange={(e) => onIsPublicChange(e.target.checked)}
        />
      </Stack>
    </Dialog>
  );
}

/** Issue filter bar with type, status, priority, label, and assignee filters. */
export function FilterBar({ projectId, filters, onFilterChange }: FilterBarProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const savedFilters = useAuthenticatedQuery(api.savedFilters.list, { projectId });
  const { mutate: createFilter } = useAuthenticatedMutation(api.savedFilters.create);
  const { mutate: removeFilter } = useAuthenticatedMutation(api.savedFilters.remove);
  const labels = useAuthenticatedQuery(api.labels.list, { projectId });
  const members = useAuthenticatedQuery(api.projectMembers.list, { projectId });

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      showError("Please enter a filter name");
      return;
    }

    try {
      await createFilter({
        projectId,
        name: filterName,
        filters: filters,
        isPublic,
      });
      showSuccess("Filter saved");
      setShowSaveDialog(false);
      setFilterName("");
      setIsPublic(false);
    } catch (error) {
      showError(error, "Failed to save filter");
    }
  };

  const handleLoadFilter = (savedFilter: EnrichedSavedFilter) => {
    onFilterChange(savedFilter.filters as BoardFilters);
    showSuccess("Filter applied");
  };

  const handleDeleteFilter = async (id: Id<"savedFilters">) => {
    try {
      await removeFilter({ id });
      showSuccess("Filter deleted");
    } catch (error) {
      showError(error, "Failed to delete filter");
    }
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const toggleArrayFilter = <K extends keyof BoardFilters>(
    key: K,
    value: BoardFilters[K] extends (infer U)[] | undefined ? U : never,
  ) => {
    const currentArray = (filters[key] ?? []) as (typeof value)[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];

    onFilterChange({
      ...filters,
      [key]: newArray.length > 0 ? newArray : undefined,
    });
  };

  const activeFilterCount = countActiveFilters(filters);
  const hasActiveFilters = activeFilterCount > 0;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Store the raw value but treat whitespace-only as empty
    onFilterChange({
      ...filters,
      query: value.trim() ? value : undefined,
    });
  };

  return (
    <Card
      recipe="filterBar"
      padding="none"
      className="overflow-x-auto px-1 pb-0.5 sm:px-4 sm:pb-2 sm:pt-3"
    >
      <Flex align="center" gap="sm" className="min-w-max">
        {/* Search Input */}
        <Input
          type="text"
          placeholder="Search"
          variant="filter"
          inputSize="filterSearchPill"
          value={filters.query ?? ""}
          onChange={handleSearchChange}
          aria-label="Search issues"
        />

        {/* Divider */}
        <div className="hidden h-5 w-px bg-ui-border/70 sm:block sm:h-6" />

        {/* Type Filter */}
        <FilterDropdown
          label="Type"
          shortLabel="Type"
          activeCount={filters.type?.length ?? 0}
          items={ISSUE_TYPES}
          selectedValues={filters.type}
          onToggle={(type) => toggleArrayFilter("type", type)}
          getKey={(type) => type}
          renderItem={(type) => (
            <Flex align="center" gap="sm">
              <Icon icon={ISSUE_TYPE_ICONS[type]} size="sm" />
              <Typography variant="small" className="capitalize">
                {type}
              </Typography>
            </Flex>
          )}
        />

        {/* Priority Filter */}
        <FilterDropdown
          label="Priority"
          shortLabel="Pri"
          activeCount={filters.priority?.length ?? 0}
          items={PRIORITIES_DISPLAY_ORDER}
          selectedValues={filters.priority}
          onToggle={(priority) => toggleArrayFilter("priority", priority)}
          getKey={(priority) => priority}
          renderItem={(priority) => (
            <Typography variant="small" className="capitalize">
              {priority}
            </Typography>
          )}
        />

        {/* Assignee Filter */}
        <FilterDropdown
          label="Assignee"
          shortLabel="Assign"
          activeCount={filters.assigneeId?.length ?? 0}
          items={members?.map((m) => m.userId)}
          selectedValues={filters.assigneeId}
          onToggle={(userId) => toggleArrayFilter("assigneeId", userId)}
          getKey={(userId) => userId}
          renderItem={(userId) => members?.find((m) => m.userId === userId)?.userName ?? "Unknown"}
          emptyMessage="No members"
          scrollable
        />

        {/* Labels Filter */}
        <FilterDropdown
          label="Labels"
          shortLabel="Tags"
          activeCount={filters.labels?.length ?? 0}
          items={labels?.map((l) => l.name)}
          selectedValues={filters.labels}
          onToggle={(name) => toggleArrayFilter("labels", name)}
          getKey={(name) => name}
          renderItem={(name) => {
            const label = labels?.find((l) => l.name === name);
            return (
              <Flex align="center" gap="sm">
                <Icon
                  icon={Circle}
                  size="xs"
                  className="fill-current"
                  style={{ color: label?.color }}
                />
                {name}
              </Flex>
            );
          }}
          emptyMessage="No labels"
          scrollable
        />

        {/* Date divider */}
        <div className="hidden h-6 w-px bg-ui-border/70 sm:block" />

        {/* Due Date Filter */}
        <DateRangeDropdown
          label="Due Date"
          shortLabel="Due"
          value={filters.dueDate}
          onChange={(dueDate) => onFilterChange({ ...filters, dueDate })}
        />

        {/* Start Date Filter */}
        <DateRangeDropdown
          label="Start Date"
          shortLabel="Start"
          value={filters.startDate}
          onChange={(startDate) => onFilterChange({ ...filters, startDate })}
        />

        {/* Created Date Filter */}
        <DateRangeDropdown
          label="Created"
          shortLabel="Created"
          value={filters.createdAt}
          onChange={(createdAt) => onFilterChange({ ...filters, createdAt })}
        />

        {/* Divider */}
        {hasActiveFilters && <div className="hidden h-5 w-px bg-ui-border/70 sm:block sm:h-6" />}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button chrome="filter" chromeSize="filterPill" onClick={handleClearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}

        {/* Save Filter */}
        {hasActiveFilters && (
          <Button chrome="filter" chromeSize="filterPill" onClick={() => setShowSaveDialog(true)}>
            Save Filter
          </Button>
        )}

        {/* Saved Filters */}
        {savedFilters && savedFilters.length > 0 && (
          <>
            <div className="hidden h-5 w-px bg-ui-border/70 sm:block sm:h-6" />
            <SavedFiltersDropdown
              savedFilters={savedFilters}
              onLoadFilter={handleLoadFilter}
              onDeleteFilter={(id) => void handleDeleteFilter(id)}
            />
          </>
        )}
      </Flex>

      {/* Save Filter Dialog */}
      <SaveFilterDialog
        open={showSaveDialog}
        onOpenChange={(open) => {
          setShowSaveDialog(open);
          if (!open) {
            setFilterName("");
            setIsPublic(false);
          }
        }}
        filterName={filterName}
        onFilterNameChange={setFilterName}
        isPublic={isPublic}
        onIsPublicChange={setIsPublic}
        onSave={() => void handleSaveFilter()}
        onCancel={() => {
          setShowSaveDialog(false);
          setFilterName("");
          setIsPublic(false);
        }}
      />
    </Card>
  );
}
