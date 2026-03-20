import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, PageLayout } from "@/components/layout";
import { MeetingsWorkspace } from "@/components/Meetings/MeetingsWorkspace";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute("/_auth/_app/$orgSlug/meetings")({
  component: MeetingsPage,
});

function MeetingsPage() {
  const { orgSlug } = useOrganization();

  return (
    <PageLayout>
      <PageHeader
        title="Meetings"
        description="Review recordings, summaries, participants, and follow-up work in one place."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link to={ROUTES.calendar.path} params={{ orgSlug }}>
              Open Calendar
            </Link>
          </Button>
        }
      />
      <MeetingsWorkspace />
    </PageLayout>
  );
}
