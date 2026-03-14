import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";

/** Calendar header container with date and action buttons. */
export function CalendarHeader({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Card recipe="calendarHeaderShell">
      <Flex
        direction="column"
        directionMd="row"
        justify="between"
        gap="xs"
        gapSm="lg"
        alignMd="center"
      >
        {children}
      </Flex>
    </Card>
  );
}
