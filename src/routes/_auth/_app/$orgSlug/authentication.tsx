import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageLayout } from "@/components/layout";
import { SSOSettings } from "@/components/Settings/SSOSettings";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute("/_auth/_app/$orgSlug/authentication")({
  component: AuthenticationPage,
});

function AuthenticationPage() {
  const { organizationId } = useOrganization();

  return (
    <PageLayout>
      <PageHeader title="Authentication" />
      <SSOSettings organizationId={organizationId} />
    </PageLayout>
  );
}
