import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/settings",
)({
  component: TeamSettings,
});

function TeamSettings() {
  return (
    <div className="max-w-3xl mx-auto py-6">
      <Flex direction="column" gap="xl">
        {/* Page header with Mintlify-inspired typography */}
        <div className="pb-2 border-b border-ui-border">
          <Typography variant="h2" className="text-2xl font-semibold tracking-tight">
            Team Settings
          </Typography>
          <Typography variant="p" color="secondary" className="mt-1.5">
            Manage team members and preferences
          </Typography>
        </div>

        {/* Coming soon placeholder */}
        <Card variant="soft">
          <div className="p-8 text-center">
            <Flex
              inline
              align="center"
              justify="center"
              className="w-12 h-12 rounded-full bg-brand-subtle mb-4"
            >
              <svg
                role="img"
                aria-label="Team settings icon"
                className="w-6 h-6 text-brand"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <title>Team settings icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </Flex>
            <Typography variant="large" className="font-semibold tracking-tight mb-2">
              Coming Soon
            </Typography>
            <Typography variant="p" color="secondary" className="max-w-sm mx-auto">
              Team settings including member management, roles, and permissions will be available
              here.
            </Typography>
          </div>
        </Card>
      </Flex>
    </div>
  );
}
