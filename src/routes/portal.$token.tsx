import { createFileRoute } from "@tanstack/react-router";
import { PortalHeader } from "@/components/ClientPortal/PortalHeader";
import { PortalProjectView } from "@/components/ClientPortal/PortalProjectView";
import { PortalTimeline } from "@/components/ClientPortal/PortalTimeline";
import { PageLayout } from "@/components/layout";

export const Route = createFileRoute("/portal/$token")({
  component: ClientPortalEntryPage,
});

function ClientPortalEntryPage() {
  const { token } = Route.useParams();

  return (
    <PageLayout>
      <PortalHeader
        title="Client Portal"
        subtitle="Read-only project access via secure magic link"
      />
      <div className="space-y-4">
        <PortalProjectView
          token={token}
          project={{
            _id: "placeholder-project",
            name: "Project access loading",
            key: "PORTAL",
          }}
        />
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
