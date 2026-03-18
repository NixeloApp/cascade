import { createFileRoute } from "@tanstack/react-router";
import { Server } from "lucide-react";
import { PageHeader, PageLayout } from "@/components/layout";
import { EmptyState } from "@/components/ui/EmptyState";

export const Route = createFileRoute("/_auth/_app/$orgSlug/mcp-server")({
  component: McpServerPage,
});

function McpServerPage() {
  return (
    <PageLayout>
      <PageHeader title="MCP Server" />
      <EmptyState
        icon={Server}
        title="Configuration coming soon"
        description="Connect AI tools to your workspace data through the Model Context Protocol."
      />
    </PageLayout>
  );
}
