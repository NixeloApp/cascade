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
  let assigneeId: "me" | undefined;
  let hasShortcuts = false;

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (lower === "@me" || lower === "assignee:me") {
      assigneeId = "me";
      hasShortcuts = true;
      continue;
    }

    if (lower.startsWith("type:")) {
      const value = lower.slice("type:".length).trim();
      if (value.length > 0) {
        pushUnique(typeTokens, value);
        hasShortcuts = true;
        continue;
      }
    }

    if (lower.startsWith("status:")) {
      const value = lower.slice("status:".length).trim();
      if (value.length > 0) {
        pushUnique(statusTokens, value);
        hasShortcuts = true;
        continue;
      }
    }

    textTokens.push(token);
  }

  return {
    textQuery: textTokens.join(" ").trim(),
    filters: {
      type: typeTokens.length > 0 ? typeTokens : undefined,
      status: statusTokens.length > 0 ? statusTokens : undefined,
      assigneeId,
    },
    hasShortcuts,
  };
}
