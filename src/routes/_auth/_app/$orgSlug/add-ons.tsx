import { createFileRoute } from "@tanstack/react-router";
import { Puzzle } from "lucide-react";
import { PageHeader, PageLayout } from "@/components/layout";
import { EmptyState } from "@/components/ui/EmptyState";

export const Route = createFileRoute("/_auth/_app/$orgSlug/add-ons")({
  component: AddOnsPage,
});

function AddOnsPage() {
  return (
    <PageLayout>
      <PageHeader title="Add-ons" />
      <EmptyState
        icon={Puzzle}
        title="Marketplace coming soon"
        description="Browse and install add-ons to extend your workspace with integrations, automations, and more."
      />
    </PageLayout>
  );
}
