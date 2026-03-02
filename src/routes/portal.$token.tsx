import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { useEffect, useState } from "react";
import { PortalHeader } from "@/components/ClientPortal/PortalHeader";
import { PortalProjectView } from "@/components/ClientPortal/PortalProjectView";
import { PortalTimeline } from "@/components/ClientPortal/PortalTimeline";
import { PageLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/portal/$token")({
  component: ClientPortalEntryPage,
});

const clientPortalApi = anyApi.clientPortal;

function ClientPortalEntryPage() {
  const { token } = Route.useParams();
  const [validatedClientName, setValidatedClientName] = useState<string | null>(null);

  const validateToken = useMutation(clientPortalApi.validateToken);
  const projects = useQuery(clientPortalApi.getProjectsForToken, { token }) as
    | Array<{ _id: string; name: string; key: string }>
    | undefined;

  useEffect(() => {
    void (async () => {
      const validated = await validateToken({ token });
      setValidatedClientName(validated?.clientName ?? null);
    })();
  }, [token, validateToken]);

  return (
    <PageLayout>
      <PortalHeader
        title="Client Portal"
        subtitle={
          validatedClientName
            ? `Welcome, ${validatedClientName}`
            : "Read-only project access via secure magic link"
        }
      />
      <div className="space-y-4">
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <PortalProjectView key={project._id} token={token} project={project} />
          ))
        ) : (
          <Card>
            <CardContent className="pt-4">
              <Typography variant="small" color="secondary">
                No projects are available for this portal token.
              </Typography>
            </CardContent>
          </Card>
        )}
        <PortalTimeline
          items={[
            {
              id: "portal-init",
              label: "Portal token received",
              timestamp: new Date().toISOString(),
            },
          ]}
        />
      </div>
    </PageLayout>
  );
}
