import { Flex } from "@/components/ui/Flex";

/** Container for calendar header action buttons. */
export function CalendarHeaderActions({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Flex align="center" justify="between" justifySm="start" gap="sm" className="w-full sm:w-auto">
      {children}
    </Flex>
  );
}
