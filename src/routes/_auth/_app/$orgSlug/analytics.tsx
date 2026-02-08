import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageLayout } from "@/components/layout";
import { Card, CardBody } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { BarChart3 } from "@/lib/icons";

export const Route = createFileRoute("/_auth/_app/$orgSlug/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <PageLayout>
      <PageHeader title="Analytics" icon={BarChart3} />
      <Card>
        <CardBody>
          <Typography variant="muted">Analytics dashboard coming soon.</Typography>
        </CardBody>
      </Card>
    </PageLayout>
  );
}
