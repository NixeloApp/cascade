/** Calendar header container with date and action buttons. */
export function CalendarHeader({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex flex-col justify-between gap-1 border-b border-ui-border bg-ui-bg px-1 py-1 sm:px-4 sm:py-4 lg:flex-row lg:items-center lg:gap-4">
      {children}
    </div>
  );
}
