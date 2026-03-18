import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PageHeader, PageLayout } from "@/components/layout";
import { EmptyState } from "@/components/ui/EmptyState";

export const Route = createFileRoute("/_auth/_app/$orgSlug/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <PageLayout>
      <PageHeader title="Analytics" />
      <EmptyState
        icon={BarChart3}
        title="Analytics dashboard coming soon"
        description="Track team velocity, issue throughput, and project health metrics across your organization."
      />
    </PageLayout>
  );
}
