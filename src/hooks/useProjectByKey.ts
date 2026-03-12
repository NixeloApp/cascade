import { api } from "@convex/_generated/api";
import { useOrganization } from "@/hooks/useOrgContext";
import { useAuthenticatedQuery } from "./useConvexHelpers";

export function useProjectByKey(key: string) {
  const { organizationId } = useOrganization();
  return useAuthenticatedQuery(api.projects.getByKey, { key, organizationId });
}
