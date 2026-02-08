import { createFileRoute } from "@tanstack/react-router";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar",
)({
  component: TeamCalendar,
});

function TeamCalendar() {
  return (
    <Flex direction="column" align="center" justify="center" className="h-full p-8">
      <Flex
        align="center"
        justify="center"
        className="w-16 h-16 rounded-full bg-ui-bg-tertiary mb-4"
      >
        <svg
          className="w-8 h-8 text-ui-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
          />
        </svg>
      </Flex>
      <Typography variant="h2" className="text-ui-text mb-2">
        Team Calendar
      </Typography>
      <Typography variant="p" color="secondary" className="text-center max-w-md">
        Coming soon: View all team events, meetings, and milestones in one place
      </Typography>
    </Flex>
  );
}
