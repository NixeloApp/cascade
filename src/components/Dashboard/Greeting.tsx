import { Badge } from "../ui/Badge";
import { Flex } from "../ui/Flex";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface GreetingProps {
  userName?: string;
  completedCount?: number;
}

/** Time-based greeting message with weekly completion stats. */
export function Greeting({ userName, completedCount = 0 }: GreetingProps) {
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const firstName = userName?.split(" ")[0] || "there";

  return (
    <Stack gap="sm" className="max-w-4xl">
      <Flex align="center" gap="sm" wrap>
        <Badge variant="neutral" size="sm" shape="pill">
          Today
        </Badge>
        <Typography variant="small" color="secondary">
          {completedCount > 0
            ? `${completedCount} ${completedCount === 1 ? "task" : "tasks"} completed this week`
            : "Command overview"}
        </Typography>
      </Flex>
      <Typography variant="h2" className="max-w-3xl text-balance">
        {greeting}, <span className="text-brand">{firstName}</span>.
      </Typography>
      <Typography variant="small" color="secondary" className="max-w-2xl text-balance">
        {completedCount > 0 ? (
          <>
            You closed{" "}
            <Typography as="strong" variant="strong" className="text-ui-text">
              {completedCount} {completedCount === 1 ? "task" : "tasks"}
            </Typography>{" "}
            this week. Keep the highest-impact work moving and the rest visible.
          </>
        ) : (
          "Your current workload, workspaces, and recent activity are all visible in one place."
        )}
      </Typography>
    </Stack>
  );
}
