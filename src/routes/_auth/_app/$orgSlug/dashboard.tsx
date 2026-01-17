import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/Dashboard";

export const Route = createFileRoute("/_auth/_app/$orgSlug/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return <Dashboard />;
}
