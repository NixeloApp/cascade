/** Calendar header container with date and action buttons. */
export function CalendarHeader({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex lg:flex-row flex-col lg:items-center justify-between p-4 gap-4 border-b border-ui-border bg-ui-bg">
      {children}
    </div>
  );
}
