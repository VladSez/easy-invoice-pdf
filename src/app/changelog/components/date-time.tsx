export function DateTime({
  dateTime = "",
  children,
}: {
  dateTime: string;
  children: React.ReactNode;
}) {
  return (
    <time
      className="inline-flex items-center rounded-md bg-blue-50/50 px-3 py-1.5 text-sm font-medium text-blue-800 shadow-sm ring-1 ring-blue-200 transition-colors hover:bg-blue-50 hover:text-blue-800/90 dark:bg-blue-950 dark:text-blue-100 dark:ring-blue-800 dark:hover:bg-blue-900 dark:hover:text-blue-50"
      dateTime={dateTime}
    >
      {children}
    </time>
  );
}
