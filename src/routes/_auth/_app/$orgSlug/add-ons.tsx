import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageLayout } from "@/components/layout";
import { Card, CardBody } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Puzzle } from "@/lib/icons";

export const Route = createFileRoute("/_auth/_app/$orgSlug/add-ons")({
  component: AddOnsPage,
});

function AddOnsPage() {
  return (
    <PageLayout>
      <PageHeader title="Add-ons" icon={Puzzle} />
      <Card>
        <CardBody>
          <Typography variant="muted">Add-ons marketplace coming soon.</Typography>
        </CardBody>
      </Card>
    </PageLayout>
  );
}
