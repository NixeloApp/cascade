import { Badge } from "../ui/Badge";
import { Dot } from "../ui/Dot";
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
    <Stack gap="sm" className="mb-8">
      <Badge variant="commandCenter" size="md" shape="pill" className="w-fit">
        <Flex align="center" gap="sm">
          <Dot />
          <Typography variant="eyebrowWide">Command Center</Typography>
        </Flex>
      </Badge>
      <Typography variant="dashboardHeroTitle" className="max-w-4xl">
        {greeting}, <span className="text-brand">{firstName}</span>.
      </Typography>
      <Typography variant="lead" color="secondary" className="max-w-3xl text-balance">
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
