/** Calendar header container with date and action buttons. */
export function CalendarHeader({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex flex-col justify-between gap-1.5 border-b border-ui-border bg-ui-bg px-1.5 py-1.5 sm:px-4 sm:py-4 lg:flex-row lg:items-center lg:gap-4">
      {children}
    </div>
  );
}
