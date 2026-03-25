export interface WorkspaceSearchable {
  name: string;
  slug: string;
  description?: string | null;
}

interface WorkspaceOverviewCopyArgs {
  workspaceCount: number;
  totalTeams: number;
  totalProjects: number;
}

/** Build a stable workspace slug from a user-provided name. */
export function buildWorkspaceSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normalize a workspace search query for case-insensitive matching. */
export function normalizeWorkspaceSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

/** Filter workspaces by name, slug, or description using the active query. */
export function filterWorkspaces<T extends WorkspaceSearchable>(
  workspaces: readonly T[],
  query: string,
): T[] {
  const normalizedQuery = normalizeWorkspaceSearchQuery(query);
  if (!normalizedQuery) {
    return [...workspaces];
  }

  return workspaces.filter((workspace) =>
    [workspace.name, workspace.slug, workspace.description ?? ""].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    ),
  );
}

/** Determine whether the route should render the workspace search control. */
export function shouldShowWorkspaceSearch(workspaceCount: number, query: string): boolean {
  return workspaceCount > 0 || normalizeWorkspaceSearchQuery(query).length > 0;
}

/** Build the search summary copy for the active workspace query. */
export function getWorkspaceSearchSummary(matchCount: number, query: string): string {
  const trimmedQuery = query.trim();
  return `${matchCount} workspace${matchCount === 1 ? "" : "s"} matching "${trimmedQuery}"`;
}

/** Build the empty-state copy for a workspace search that found no matches. */
export function getWorkspaceSearchEmptyState(query: string): {
  title: string;
  description: string;
} {
  const trimmedQuery = query.trim();
  return {
    title: `No workspaces match "${trimmedQuery}"`,
    description:
      "Try a different workspace name, slug, or description, or clear the current search.",
  };
}

/** Build concrete route copy for the workspace structure summary band. */
export function getWorkspaceOverviewCopy({
  workspaceCount,
  totalTeams,
  totalProjects,
}: WorkspaceOverviewCopyArgs): {
  eyebrow: string;
  title: string;
  description: string;
} {
  const workspaceLabel = `${workspaceCount} workspace${workspaceCount === 1 ? "" : "s"}`;
  const teamLabel = `${totalTeams} team${totalTeams === 1 ? "" : "s"}`;
  const projectLabel = `${totalProjects} project${totalProjects === 1 ? "" : "s"}`;

  return {
    eyebrow: "Organization structure",
    title: `${workspaceLabel}, ${teamLabel}, and ${projectLabel} are active.`,
    description:
      "Use this list to confirm where new teams and projects belong before you create them.",
  };
}
