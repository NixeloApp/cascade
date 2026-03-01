/** Container for calendar header action buttons. */
export function CalendarHeaderActions({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <div className="flex md:justify-start justify-between items-center gap-2">{children}</div>;
}
