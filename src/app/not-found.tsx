import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full items-center justify-center font-sans">
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center">
          <h1 className="mr-5 border-r border-r-black/30 pr-6 text-2xl font-medium dark:border-r-white/30">
            404
          </h1>
          <div>
            <h2 className="text-base font-normal">
              This page could not be found.
            </h2>
            <Link
              href="/"
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
