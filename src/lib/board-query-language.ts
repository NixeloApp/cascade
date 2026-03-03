/**
 * Lightweight board query-language parser.
 *
 * Supported filters:
 * - `status:<value>`
 * - `priority:<value>`
 * - `type:<value>`
 * - `label:<value>` / `labels:<value>`
 */
export interface BoardQueryFilters {
  status?: string[];
  priority?: string[];
  type?: string[];
  labels?: string[];
}

export interface ParsedBoardQuery {
  textTerms: string[];
  filters: BoardQueryFilters;
}

function pushUnique(values: string[], value: string) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

export function parseBoardQuery(query?: string): ParsedBoardQuery {
  if (!query?.trim()) {
    return { textTerms: [], filters: {} };
  }

  const status: string[] = [];
  const priority: string[] = [];
  const type: string[] = [];
  const labels: string[] = [];
  const textTerms: string[] = [];

  const tokens = query.trim().split(/\s+/).filter(Boolean);

  const pushFromPrefix = (token: string, prefix: string, values: string[]) => {
    if (!token.startsWith(prefix)) return false;
    const value = token.slice(prefix.length).trim();
    if (!value) return false;
    pushUnique(values, value);
    return true;
  };

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (
      pushFromPrefix(lower, "status:", status) ||
      pushFromPrefix(lower, "priority:", priority) ||
      pushFromPrefix(lower, "type:", type) ||
      pushFromPrefix(lower, "label:", labels) ||
      pushFromPrefix(lower, "labels:", labels)
    ) {
      continue;
    }
    textTerms.push(lower);
  }

  return {
    textTerms,
    filters: {
      status: status.length > 0 ? status : undefined,
      priority: priority.length > 0 ? priority : undefined,
      type: type.length > 0 ? type : undefined,
      labels: labels.length > 0 ? labels : undefined,
    },
  };
}

interface BoardQueryIssue {
  title: string;
  key: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  labels?: Array<{ name: string }>;
}

export function matchesBoardQuery(issue: BoardQueryIssue, parsed: ParsedBoardQuery): boolean {
  const issueStatus = issue.status.toLowerCase();
  const issuePriority = issue.priority.toLowerCase();
  const issueType = issue.type.toLowerCase();
  const issueLabels = issue.labels?.map((label) => label.name.toLowerCase()) ?? [];

  if (parsed.filters.status?.length && !parsed.filters.status.includes(issueStatus)) {
    return false;
  }
  if (parsed.filters.priority?.length && !parsed.filters.priority.includes(issuePriority)) {
    return false;
  }
  if (parsed.filters.type?.length && !parsed.filters.type.includes(issueType)) {
    return false;
  }
  if (
    parsed.filters.labels?.length &&
    !parsed.filters.labels.some((name) => issueLabels.includes(name))
  ) {
    return false;
  }

  if (parsed.textTerms.length === 0) {
    return true;
  }

  const haystack = `${issue.title} ${issue.key} ${issue.description ?? ""}`.toLowerCase();
  return parsed.textTerms.every((term) => haystack.includes(term));
}
