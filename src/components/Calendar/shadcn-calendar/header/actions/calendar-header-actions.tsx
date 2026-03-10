/** Container for calendar header action buttons. */
export function CalendarHeaderActions({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
      {children}
    </div>
  );
}
