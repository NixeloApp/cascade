import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { IssueDetailHeader, IssueDetailLayout, useIssueDetail } from "@/components/IssueDetailView";
import { PageContent, PageError } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { ChevronLeft } from "@/lib/icons";

export const Route = createFileRoute("/_auth/_app/$orgSlug/issues/$key")({
  component: IssuePage,
});

function IssuePage() {
  const { orgSlug, key } = Route.useParams();
  const { billingEnabled } = useOrganization();

  // Parse project key from issue key (e.g., "PROJ-123" -> "PROJ")
  const parts = key.split("-");
  const projectKey = parts.slice(0, -1).join("-");

  // Get issue ID by key first
  const issueByKey = useQuery(api.issues.getByKey, { key });

  if (issueByKey === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  if (issueByKey === null) {
    return (
      <PageError
        title="Issue not found"
        message={`The issue "${key}" does not exist or you don't have access to it.`}
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.dashboard.path} params={{ orgSlug }}>
              Back to dashboard
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <IssuePageContent
      issueId={issueByKey._id}
      orgSlug={orgSlug}
      projectKey={projectKey}
      billingEnabled={billingEnabled}
    />
  );
}

function IssuePageContent({
  issueId,
  orgSlug,
  projectKey,
  billingEnabled,
}: {
  issueId: Id<"issues">;
  orgSlug: string;
  projectKey: string;
  billingEnabled: boolean;
}) {
  const detail = useIssueDetail(issueId);

  return (
    <IssueDetailLayout
      detail={detail}
      billingEnabled={billingEnabled}
      header={
        detail.issue && (
          <IssueDetailHeader
            issueKey={detail.issue.key}
            issueType={detail.issue.type}
            hasCopied={detail.hasCopied}
            onCopyKey={detail.handleCopyKey}
            breadcrumb={
              <Button asChild variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                <Link to={ROUTES.projects.board.path} params={{ orgSlug, key: projectKey }}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {projectKey}
                </Link>
              </Button>
            }
            actions={
              !detail.isEditing ? (
                <Button variant="outline" size="sm" onClick={detail.handleEdit}>
                  Edit Issue
                </Button>
              ) : undefined
            }
          />
        )
      }
    />
  );
}
