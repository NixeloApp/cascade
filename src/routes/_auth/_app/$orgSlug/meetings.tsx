import { createFileRoute } from "@tanstack/react-router";
import { MeetingsWorkspace } from "@/components/Meetings/MeetingsWorkspace";
import { PageHeader, PageLayout } from "@/components/layout";

export const Route = createFileRoute("/_auth/_app/$orgSlug/meetings")({
  component: MeetingsPage,
});

function MeetingsPage() {
  return (
    <PageLayout>
      <PageHeader
        title="Meetings"
        description="Review recordings, summaries, participants, and follow-up work in one place."
      />
      <MeetingsWorkspace />
    </PageLayout>
  );
}
