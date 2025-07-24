export default function Loading() {
  return (
    <div className={`
      flex flex-col items-center justify-start bg-gray-100
      sm:p-4
      md:justify-center
      lg:min-h-screen
    `}>
      <div className={`
        w-full max-w-7xl bg-white p-3 shadow-lg
        sm:mb-0 sm:rounded-lg sm:p-6
        2xl:max-w-[1680px]
      `}>
        <div className={`
          grid grid-cols-1 gap-8
          lg:grid-cols-12
        `}>
          {/* Left side - Form */}
          <div className={`
            col-span-8 w-full space-y-6
            lg:col-span-4
          `}>
            <div className={`
              h-8 w-full animate-pulse rounded bg-gray-200
              lg:w-64
            `} />

            {/* Form fields skeleton */}
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-10 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>

          {/* Right side - PDF Preview */}
          <div className={`
            col-span-8 h-[480px] w-full max-w-full
            sm:h-[690px]
            2xl:h-[800px]
          `}>
            <div className="h-full animate-pulse rounded-lg bg-gray-200">
              <div className="flex items-center justify-between rounded-t-lg bg-gray-300 p-4">
                <div className={`
                  h-6 w-full animate-pulse rounded bg-gray-400
                  lg:w-48
                `} />
                <div className={`
                  hidden gap-2
                  lg:flex
                `}>
                  <div className="h-8 w-32 animate-pulse rounded bg-gray-400" />
                  <div className="h-8 w-32 animate-pulse rounded bg-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
