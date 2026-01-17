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
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <Flex direction="column" gap="xs">
        <Typography variant="h1" className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {greeting}, <span className="text-brand-600 dark:text-brand-400">{firstName}</span>.
        </Typography>
        <Typography variant="lead" color="secondary" className="max-w-2xl">
          {completedCount > 0 ? (
            <>
              You've crushed{" "}
              <span className="font-bold text-ui-text-primary">{completedCount} tasks</span> this
              week. Keep that momentum going! 🚀
            </>
          ) : (
            "Ready to tackle your goals for today? Let's make it productive!"
          )}
        </Typography>
      </Flex>
    </div>
  );
}
