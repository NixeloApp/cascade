import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/settings")({
  component: WorkspaceSettings,
});

function WorkspaceSettings() {
  return (
    <div className="max-w-3xl mx-auto py-6">
      <Flex direction="column" gap="xl">
        {/* Page header with Mintlify-inspired typography */}
        <div className="pb-2 border-b border-ui-border">
          <Typography variant="h2" className="text-2xl font-semibold tracking-tight">
            Workspace Settings
          </Typography>
          <Typography variant="p" color="secondary" className="mt-1.5">
            Configure workspace settings and preferences
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
                className="w-6 h-6 text-brand"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Flex>
            <Typography variant="large" className="font-semibold tracking-tight mb-2">
              Coming Soon
            </Typography>
            <Typography variant="p" color="secondary" className="max-w-sm mx-auto">
              Workspace settings including permissions, integrations, and preferences will be
              available here.
            </Typography>
          </div>
        </Card>
      </Flex>
    </div>
  );
}
