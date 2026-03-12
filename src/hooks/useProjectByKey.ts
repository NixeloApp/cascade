import { api } from "@convex/_generated/api";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";

/** Look up a project by key within the active organization context. */
export function useProjectByKey(key: string) {
  const { organizationId } = useOrganization();
  return useAuthenticatedQuery(api.projects.getByKey, { key, organizationId });
}
