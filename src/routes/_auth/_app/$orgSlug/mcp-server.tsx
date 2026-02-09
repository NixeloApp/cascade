import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageLayout } from "@/components/layout";
import { Card, CardBody } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/_auth/_app/$orgSlug/mcp-server")({
  component: McpServerPage,
});

function McpServerPage() {
  return (
    <PageLayout>
      <PageHeader title="MCP Server" />
      <Card>
        <CardBody>
          <Typography variant="muted">MCP Server configuration coming soon.</Typography>
        </CardBody>
      </Card>
    </PageLayout>
  );
}
