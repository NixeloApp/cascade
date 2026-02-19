import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { ISSUE_PRIORITIES, ISSUE_TYPES } from "@convex/validators";
import { useMutation, useQuery } from "convex/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, X } from "@/lib/icons";
import { ISSUE_TYPE_ICONS, type IssuePriority, type IssueType } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Dialog } from "./ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { Flex, FlexItem } from "./ui/Flex";
import { Checkbox, Input } from "./ui/form";
import { Icon } from "./ui/Icon";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

export interface BoardFilters {
  type?: Exclude<IssueType, "subtask">[];
  priority?: IssuePriority[];
  assigneeId?: Id<"users">[];
  labels?: string[];
}

interface FilterBarProps {
  projectId: Id<"projects">;
  filters: BoardFilters;
  onFilterChange: (filters: BoardFilters) => void;
}

const PRIORITIES_DISPLAY_ORDER = [...ISSUE_PRIORITIES].reverse();

/** Count total active filters across all filter types */
function countActiveFilters(filters: BoardFilters): number {
  return (
    (filters.type?.length ?? 0) +
    (filters.priority?.length ?? 0) +
    (filters.assigneeId?.length ?? 0) +
    (filters.labels?.length ?? 0)
  );
}

/** Reusable filter dropdown to reduce component complexity */
interface FilterDropdownProps<T> {
  label: string;
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
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 px-3", isActive && "bg-brand-subtle text-brand")}
        >
          {label}
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
        <Button variant="ghost" size="sm" className="h-8 px-3">
          Saved Filters ({savedFilters.length})
          <ChevronDown className="ml-1 w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto min-w-48">
        {savedFilters.map((filter) => (
          <Flex
            key={filter._id}
            align="center"
            justify="between"
            className="hover:bg-ui-bg-secondary rounded cursor-pointer"
          >
            <button type="button" onClick={() => onLoadFilter(filter)} className="flex-1 text-left">
              <Typography variant="small" as="span">
                {filter.name}
              </Typography>
              {filter.isPublic && (
                <Typography variant="caption" color="tertiary" as="span" className="ml-1">
                  (public)
                </Typography>
              )}
            </button>
            {filter.isOwner && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFilter(filter._id);
                }}
                className="p-1 text-ui-text-tertiary hover:text-status-error"
                aria-label="Delete filter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Flex>
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
      className="sm:max-w-md"
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
        <Input
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

export function FilterBar({ projectId, filters, onFilterChange }: FilterBarProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const savedFilters = useQuery(api.savedFilters.list, { projectId });
  const createFilter = useMutation(api.savedFilters.create);
  const removeFilter = useMutation(api.savedFilters.remove);
  const labels = useQuery(api.labels.list, { projectId });
  const members = useQuery(api.projectMembers.list, { projectId });

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toast.error("Please enter a filter name");
      return;
    }

    try {
      await createFilter({
        projectId,
        name: filterName,
        filters: filters,
        isPublic,
      });
      toast.success("Filter saved");
      setShowSaveDialog(false);
      setFilterName("");
      setIsPublic(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save filter");
    }
  };

  const handleLoadFilter = (savedFilter: EnrichedSavedFilter) => {
    onFilterChange(savedFilter.filters as BoardFilters);
    toast.success("Filter applied");
  };

  const handleDeleteFilter = async (id: Id<"savedFilters">) => {
    try {
      await removeFilter({ id });
      toast.success("Filter deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete filter");
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

  return (
    <div className="bg-ui-bg-soft border-b border-ui-border">
      <Flex align="center" gap="sm" wrap>
        {/* Type Filter */}
        <FilterDropdown
          label="Type"
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
          activeCount={filters.labels?.length ?? 0}
          items={labels?.map((l) => l.name)}
          selectedValues={filters.labels}
          onToggle={(name) => toggleArrayFilter("labels", name)}
          getKey={(name) => name}
          renderItem={(name) => {
            const label = labels?.find((l) => l.name === name);
            return (
              <Flex align="center" gap="sm">
                <FlexItem
                  as="span"
                  shrink={false}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: label?.color }}
                />
                {name}
              </Flex>
            );
          }}
          emptyMessage="No labels"
          scrollable
        />

        {/* Divider */}
        {hasActiveFilters && <div className="w-px h-6 bg-ui-border" />}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover transition-default"
          >
            <X className="w-4 h-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}

        {/* Save Filter */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            className="text-ui-text-secondary hover:text-brand hover:bg-ui-bg-hover transition-default"
          >
            Save Filter
          </Button>
        )}

        {/* Saved Filters */}
        {savedFilters && savedFilters.length > 0 && (
          <>
            <div className="w-px h-6 bg-ui-border" />
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
    </div>
  );
}
