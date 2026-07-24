import { Footer } from "@/app/(components)/footer";
import { ProjectLogoDescription } from "@/app/(components)/project-logo-description";
import { ProjectLogo } from "@/components/etc/project-logo";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-start bg-gray-100 md:justify-center lg:min-h-screen">
      {/* Main content */}
      <div className="mb-4 w-full max-w-[62rem] bg-white p-3 shadow-lg sm:my-4 sm:rounded-lg sm:p-6 min-[1400px]:max-w-7xl 2xl:max-w-[1480px]">
        <div className="relative bottom-2 mt-2 flex w-full flex-col justify-center sm:bottom-4 sm:mt-0">
          <div className="flex items-center">
            <ProjectLogo className="h-8 w-8" />
            <ProjectLogoDescription
              description={
                <h2 className="text-balance text-[12px] text-slate-700 sm:text-[13px]">
                  Free & Open-Source Invoice Generator
                </h2>
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left side - Form */}
          <div className="col-span-8 w-full space-y-6 lg:col-span-4">
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
          <div className="col-span-8 h-[520px] w-full max-w-full sm:h-[690px] 2xl:h-[800px]">
            <div className="h-full animate-pulse rounded-lg bg-gray-200">
              <div className="flex items-center justify-between rounded-t-lg bg-gray-300 p-4">
                <div className="h-6 w-full animate-pulse rounded bg-gray-400 lg:w-48" />
                <div className="hidden gap-2 lg:flex">
                  <div className="h-8 w-32 animate-pulse rounded bg-gray-400" />
                  <div className="h-8 w-32 animate-pulse rounded bg-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
