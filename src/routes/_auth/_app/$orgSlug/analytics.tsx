import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageLayout } from "@/components/Layout";
import { Card, CardBody } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/_auth/_app/$orgSlug/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <PageLayout>
      <PageHeader title="Analytics" />
      <Card>
        <CardBody>
          <Typography variant="muted">Analytics dashboard coming soon.</Typography>
        </CardBody>
      </Card>
    </PageLayout>
  );
}
