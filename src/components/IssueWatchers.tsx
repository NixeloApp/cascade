/**
 * Issue Watchers
 *
 * Shows users watching an issue for updates.
 * Allows users to start or stop watching an issue.
 * Watchers receive notifications on issue changes.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { InsetPanel } from "@/components/ui/InsetPanel";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Eye } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Typography } from "./ui/Typography";

interface IssueWatchersProps {
  issueId: Id<"issues">;
}

interface Watcher {
  _id: string;
  userName: string;
  userEmail?: string;
}

/** Issue watchers panel with watch/unwatch toggle and watcher list. */
export function IssueWatchers({ issueId }: IssueWatchersProps) {
  const watchers = useAuthenticatedQuery(api.watchers.getWatchers, { issueId });
  const isWatching = useAuthenticatedQuery(api.watchers.isWatching, { issueId });
  const { mutate: watch } = useAuthenticatedMutation(api.watchers.watch);
  const { mutate: unwatch } = useAuthenticatedMutation(api.watchers.unwatch);

  const handleToggleWatch = async () => {
    try {
      if (isWatching) {
        await unwatch({ issueId });
        showSuccess("Stopped watching this issue");
      } else {
        await watch({ issueId });
        showSuccess("Now watching this issue");
      }
    } catch (error) {
      showError(error, "Failed to update watch status");
    }
  };

  return (
    <Stack gap="md">
      {/* Watch/Unwatch Button */}
      <div>
        <Button
          onClick={handleToggleWatch}
          variant={isWatching ? "secondary" : "primary"}
          size="sm"
          className="w-full sm:w-auto"
          leftIcon={<Icon icon={Eye} size="sm" fill={isWatching ? "currentColor" : undefined} />}
        >
          {isWatching ? "Watching" : "Watch"}
        </Button>
      </div>

      {/* Watchers List */}
      {watchers && watchers.length > 0 && (
        <Stack gap="sm">
          <Typography variant="meta" color="secondary">
            {watchers.length} watcher{watchers.length === 1 ? "" : "s"}
          </Typography>
          <Stack gap="sm">
            {watchers.map((watcher: Watcher) => (
              <InsetPanel key={watcher._id} size="compact">
                <Flex align="center" gap="md">
                  <Avatar name={watcher.userName} size="md" />

                  <FlexItem flex="1" className="min-w-0">
                    <Typography variant="label" className="truncate">
                      {watcher.userName}
                    </Typography>
                    {watcher.userEmail && (
                      <Typography variant="caption" className="truncate">
                        {watcher.userEmail}
                      </Typography>
                    )}
                  </FlexItem>
                </Flex>
              </InsetPanel>
            ))}
          </Stack>
        </Stack>
      )}

      {/* Empty State */}
      {watchers && watchers.length === 0 && (
        <EmptyState
          icon={Eye}
          title="No watchers yet"
          description="Followers will appear here when people subscribe to this issue."
          size="compact"
          align="start"
          surface="bare"
        />
      )}
    </Stack>
  );
}
