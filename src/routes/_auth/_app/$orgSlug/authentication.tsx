import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageLayout } from "@/components/Layout";
import { Card, CardBody } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/_auth/_app/$orgSlug/authentication")({
  component: AuthenticationPage,
});

function AuthenticationPage() {
  return (
    <PageLayout>
      <PageHeader title="Authentication" />
      <Card>
        <CardBody>
          <Typography variant="muted">Authentication settings coming soon.</Typography>
        </CardBody>
      </Card>
    </PageLayout>
  );
}
