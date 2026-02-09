/**
 * Example: Assignee Search Dropdown with Fuzzy Matching
 *
 * Shows how to integrate useFuzzySearch with Convex queries
 * for a real-world use case.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useUserFuzzySearch } from "@/hooks/useFuzzySearch";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";
import { FuzzySearchInput, HighlightedText } from "./FuzzySearchInput";

/**
 * Project Member type (inferred from backend query)
 */
type ProjectMember = FunctionReturnType<typeof api.projectMembers.list>[number];

interface AssigneeSearchDropdownProps {
  /**
   * Project ID to get members from
   */
  projectId: Id<"projects">;

  /**
   * Currently selected assignee (optional)
   */
  value?: Id<"users"> | null;

  /**
   * Called when assignee is selected
   */
  onChange: (assigneeId: Id<"users"> | null) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * CSS classes
   */
  className?: string;
}

export function AssigneeSearchDropdown({
  projectId,
  value,
  onChange,
  placeholder = "Search assignee...",
  className = "",
}: AssigneeSearchDropdownProps) {
  // Step 1: Load members from Convex (permission-filtered)
  const members = useQuery(api.projectMembers.list, { projectId });

  // Step 2: Apply fuzzy search on loaded data
  // Map our custom member format to the standard name/email format the hook expects
  // We need to ensure T includes name/email for useUserFuzzySearch
  const searchItems = useMemo(() => {
    if (!members) return [];
    return members.map((m) => ({
      ...m,
      name: m.userName,
      email: m.userEmail ?? undefined,
    }));
  }, [members]);

  const { results, search, query, clear, isDebouncing } = useUserFuzzySearch(searchItems);

  if (!members) {
    return (
      <Typography variant="small" color="tertiary">
        Loading members...
      </Typography>
    );
  }

  // Get selected user details
  const selectedUser = members.find((m) => m.userId === value);

  return (
    <div className={className}>
      {/* Show selected user */}
      {selectedUser && !query && (
        <Flex
          align="center"
          justify="between"
          className="p-2 border border-ui-border-secondary rounded-lg mb-2"
        >
          <Flex gap="sm" align="center">
            <Avatar name={selectedUser.userName} email={selectedUser.userEmail} size="sm" />
            <Typography variant="small" as="span">
              {selectedUser.userName}
            </Typography>
          </Flex>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-ui-text-tertiary hover:text-status-error"
            aria-label="Clear assignee"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Clear</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </Flex>
      )}

      {/* Fuzzy search input */}
      <FuzzySearchInput
        results={results}
        query={query}
        onSearch={search}
        onSelect={(member: ProjectMember) => {
          onChange(member.userId);
          clear();
        }}
        onClear={() => onChange(null)}
        getKey={(member: ProjectMember) => member._id}
        placeholder={placeholder}
        showScore={false}
        isLoading={isDebouncing}
        aria-label="Search for assignee"
        renderItem={({ item: user, matches }) => {
          // Find the match for highlighting
          const nameMatch = matches?.find((m) => m.key === "name");

          return (
            <Flex gap="sm" align="center">
              <Avatar name={user.name} email={user.email} size="md" />
              <div>
                <Typography variant="label">
                  {nameMatch ? (
                    <HighlightedText text={user.name || "Unknown"} matches={nameMatch.indices} />
                  ) : (
                    user.name || "Unknown"
                  )}
                </Typography>
                {user.email && (
                  <Typography variant="caption" color="tertiary">
                    {user.email}
                  </Typography>
                )}
              </div>
            </Flex>
          );
        }}
      />

      {/* Helper text */}
      <Typography variant="caption" className="mt-1">
        Search by name or email • Supports typos
      </Typography>
    </div>
  );
}

/**
 * Usage Example:
 *
 * ```tsx
 * function CreateIssueModal({ projectId }) {
 *   const [assigneeId, setAssigneeId] = useState<Id<"users"> | null>(null);
 *
 *   return (
 *     <div>
 *       <label>Assignee</label>
 *       <AssigneeSearchDropdown
 *         projectId={projectId}
 *         value={assigneeId}
 *         onChange={setAssigneeId}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
