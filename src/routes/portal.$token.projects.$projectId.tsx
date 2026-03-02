import { createFileRoute } from "@tanstack/react-router";
import { PortalHeader } from "@/components/ClientPortal/PortalHeader";
import { PortalTimeline } from "@/components/ClientPortal/PortalTimeline";
import { PageLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/portal/$token/projects/$projectId")({
  component: ClientPortalProjectPage,
});

function ClientPortalProjectPage() {
  const { projectId } = Route.useParams();

  return (
    <PageLayout>
      <PortalHeader title="Project View" subtitle={`Project: ${projectId}`} />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Issues</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Typography variant="small" color="secondary">
              Issue data will render here once token validation and scoped issue queries are wired.
            </Typography>
          </CardContent>
        </Card>
        <PortalTimeline
          items={[
            {
              id: "project-opened",
              label: "Project portal view opened",
              timestamp: new Date().toISOString(),
            },
          ]}
        />
      </div>
    </PageLayout>
  );
}
