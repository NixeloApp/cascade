import { createFileRoute } from "@tanstack/react-router";
import { OutreachWorkspace } from "@/components/Outreach/OutreachWorkspace";

export const Route = createFileRoute("/_auth/_app/$orgSlug/outreach")({
  component: OutreachPage,
});

function OutreachPage() {
  return <OutreachWorkspace />;
}
