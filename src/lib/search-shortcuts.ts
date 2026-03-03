/**
 * Global-search shortcut parsing for issue filters.
 *
 * Supported shortcuts:
 * - `type:<value>` (repeatable)
 * - `status:<value>` (repeatable)
 * - `@me` / `assignee:me`
 */
export interface IssueShortcutFilters {
  type?: string[];
  status?: string[];
  priority?: string[];
  labels?: string[];
  assigneeId?: "me";
}

export interface ParsedSearchShortcuts {
  textQuery: string;
  filters: IssueShortcutFilters;
  hasShortcuts: boolean;
}

function pushUnique(values: string[], value: string) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

export function parseIssueSearchShortcuts(rawQuery: string): ParsedSearchShortcuts {
  const tokens = rawQuery.trim().split(/\s+/).filter(Boolean);
  const textTokens: string[] = [];
  const typeTokens: string[] = [];
  const statusTokens: string[] = [];
  const priorityTokens: string[] = [];
  const labelTokens: string[] = [];
  let assigneeId: "me" | undefined;
  let hasShortcuts = false;

  const pushFromPrefix = (token: string, prefix: string, values: string[]) => {
    if (!token.startsWith(prefix)) return false;
    const value = token.slice(prefix.length).trim();
    if (value.length === 0) return false;
    pushUnique(values, value);
    hasShortcuts = true;
    return true;
  };

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (lower === "@me" || lower === "assignee:me") {
      assigneeId = "me";
      hasShortcuts = true;
      continue;
    }

    if (
      pushFromPrefix(lower, "type:", typeTokens) ||
      pushFromPrefix(lower, "status:", statusTokens) ||
      pushFromPrefix(lower, "priority:", priorityTokens) ||
      pushFromPrefix(lower, "label:", labelTokens) ||
      pushFromPrefix(lower, "labels:", labelTokens)
    ) {
      continue;
    }

    textTokens.push(token);
  }

  return {
    textQuery: textTokens.join(" ").trim(),
    filters: {
      type: typeTokens.length > 0 ? typeTokens : undefined,
      status: statusTokens.length > 0 ? statusTokens : undefined,
      priority: priorityTokens.length > 0 ? priorityTokens : undefined,
      labels: labelTokens.length > 0 ? labelTokens : undefined,
      assigneeId,
    },
    hasShortcuts,
  };
}
