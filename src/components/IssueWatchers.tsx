import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
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

export function IssueWatchers({ issueId }: IssueWatchersProps) {
  const watchers = useQuery(api.watchers.getWatchers, { issueId });
  const isWatching = useQuery(api.watchers.isWatching, { issueId });
  const watch = useMutation(api.watchers.watch);
  const unwatch = useMutation(api.watchers.unwatch);

  const handleToggleWatch = async () => {
    try {
      if (isWatching) {
        await unwatch({ issueId });
        toast.success("Stopped watching this issue");
      } else {
        await watch({ issueId });
        toast.success("Now watching this issue");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update watch status");
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
        >
          {isWatching ? (
            <>
              <Eye className="w-4 h-4 mr-2 fill-current" />
              Watching
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Watch
            </>
          )}
        </Button>
      </div>

      {/* Watchers List */}
      {watchers && watchers.length > 0 && (
        <Stack gap="sm">
          <Typography variant="label">Watchers ({watchers.length})</Typography>
          <Stack gap="sm">
            {watchers.map((watcher: Watcher) => (
              <Card padding="sm" key={watcher._id} className="bg-ui-bg-secondary">
                <Flex align="center" gap="md">
                  {/* Avatar */}
                  <Avatar name={watcher.userName} size="md" />

                  {/* User Info */}
                  <FlexItem flex="1" className="min-w-0">
                    <Typography variant="p" className="font-medium truncate">
                      {watcher.userName}
                    </Typography>
                    {watcher.userEmail && (
                      <Typography variant="caption" className="truncate">
                        {watcher.userEmail}
                      </Typography>
                    )}
                  </FlexItem>
                </Flex>
              </Card>
            ))}
          </Stack>
        </Stack>
      )}

      {/* Empty State */}
      {watchers && watchers.length === 0 && (
        <Typography variant="small" color="secondary" className="text-center py-4">
          No watchers yet. Be the first to watch this issue!
        </Typography>
      )}
    </Stack>
  );
}
