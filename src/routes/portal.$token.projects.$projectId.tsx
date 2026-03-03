import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { PortalHeader } from "@/components/ClientPortal/PortalHeader";
import { PortalTimeline } from "@/components/ClientPortal/PortalTimeline";
import { PageLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/portal/$token/projects/$projectId")({
  component: ClientPortalProjectPage,
});

const clientPortalApi = anyApi.clientPortal;

function ClientPortalProjectPage() {
  const { token, projectId } = Route.useParams();
  const issues = useQuery(clientPortalApi.getIssuesForToken, { token, projectId }) as
    | Array<{ _id: string; key: string; title: string; status: string; priority: string }>
    | undefined;

  return (
    <PageLayout>
      <PortalHeader title="Project View" subtitle={`Project: ${projectId}`} />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Issues</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {issues && issues.length > 0 ? (
              <div className="space-y-2">
                {issues.map((issue) => (
                  <div key={issue._id} className="rounded-lg border border-ui-border p-3">
                    <Typography variant="small">{issue.key}</Typography>
                    <Typography variant="small">{issue.title}</Typography>
                    <Typography variant="caption" color="secondary">
                      {issue.status} · {issue.priority}
                    </Typography>
                  </div>
                ))}
              </div>
            ) : (
              <Typography variant="small" color="secondary">
                No visible issues for this project.
              </Typography>
            )}
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
