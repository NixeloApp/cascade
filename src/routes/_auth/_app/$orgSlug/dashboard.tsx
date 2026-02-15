import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/Dashboard";
import { DashboardCustomizeModal } from "@/components/Dashboard/DashboardCustomizeModal";
import { PageHeader, PageLayout } from "@/components/layout";

export const Route = createFileRoute("/_auth/_app/$orgSlug/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <PageLayout>
      <PageHeader title="Dashboard" actions={<DashboardCustomizeModal />} />
      <Dashboard />
    </PageLayout>
  );
}
