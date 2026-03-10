/** Container for calendar header action buttons. */
export function CalendarHeaderActions({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start sm:gap-2">
      {children}
    </div>
  );
}
