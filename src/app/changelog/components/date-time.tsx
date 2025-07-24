export function DateTime({
  dateTime = "",
  children,
}: {
  dateTime: string;
  children: React.ReactNode;
}) {
  return (
    <time
      className={`
        inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm
        font-medium text-gray-800 shadow-xs transition-colors
        hover:bg-gray-50 hover:text-gray-950
        dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700
        dark:hover:text-gray-50
      `}
      dateTime={dateTime}
    >
      {children}
    </time>
  );
}
