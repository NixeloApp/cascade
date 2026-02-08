import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

interface GreetingProps {
  userName?: string;
  completedCount?: number;
}

export function Greeting({ userName, completedCount = 0 }: GreetingProps) {
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const firstName = userName?.split(" ")[0] || "there";

  return (
    <div className="mb-8">
      <Flex direction="column" gap="xs">
        <Typography variant="h1" className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {greeting}, <strong className="text-brand">{firstName}</strong>.
        </Typography>
        <Typography variant="lead" color="secondary" className="max-w-2xl">
          {completedCount > 0 ? (
            <>
              <strong>
                {completedCount} {completedCount === 1 ? "task" : "tasks"}
              </strong>{" "}
              completed this week.
            </>
          ) : (
            "Here's your overview for today."
          )}
        </Typography>
      </Flex>
    </div>
  );
}
