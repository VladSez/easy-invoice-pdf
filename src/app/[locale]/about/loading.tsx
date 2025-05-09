import { Skeleton } from "@/components/ui/skeleton";
import { ProjectLogo } from "@/components/etc/project-logo";

export default function AboutLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="flex items-center justify-center">
          <div className="container h-auto px-3 py-2 sm:h-16 sm:py-0">
            <div className="flex h-full flex-row flex-wrap items-center justify-between gap-2">
              <div className="w-[53%]">
                <div className="flex items-center gap-1 sm:gap-2">
                  <ProjectLogo className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8" />
                  <div className="flex flex-col">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="mt-1 h-3 w-24" />
                  </div>
                </div>
              </div>
              <div className="flex items-center sm:mt-0 sm:gap-2">
                <Skeleton className="h-9 w-[120px]" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="flex w-full items-center justify-center bg-white py-12 md:py-24 lg:py-32 lg:pb-44">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-12 w-[80%] sm:h-14" />
                  <Skeleton className="h-16 w-[60%]" />
                </div>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Skeleton className="h-11 w-[160px]" />
                  <Skeleton className="h-11 w-[160px]" />
                </div>
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <div className="aspect-video w-full">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="flex w-full items-center justify-center bg-slate-50 py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <Skeleton className="h-8 w-32" />
              <div className="space-y-2">
                <Skeleton className="mx-auto h-10 w-[60%]" />
                <Skeleton className="mx-auto h-16 w-[80%]" />
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 pt-10 md:grid-cols-2 md:gap-10 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-full flex-col items-start gap-4 rounded-lg border border-slate-100 bg-white p-6"
                >
                  <Skeleton className="h-10 w-10" />
                  <div className="w-full space-y-2">
                    <Skeleton className="h-6 w-[70%]" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="flex w-full items-center justify-center bg-white py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Skeleton className="mx-auto h-10 w-[60%]" />
                <Skeleton className="mx-auto h-16 w-[80%]" />
              </div>
              <div className="w-full max-w-md">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="flex w-full items-center justify-center bg-slate-900 py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Skeleton className="mx-auto h-10 w-[60%]" />
                <Skeleton className="mx-auto h-16 w-[80%]" />
              </div>
              <div className="flex w-full flex-col items-center justify-center gap-6">
                <div className="flex w-full flex-col justify-center gap-2 md:flex-row">
                  <Skeleton className="h-11 w-[160px]" />
                  <Skeleton className="h-11 w-[160px]" />
                </div>
              </div>
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex w-full items-center justify-center border-t border-slate-200 bg-white py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-10 md:flex-row">
            <div className="space-y-4 md:w-1/3">
              <div className="flex items-center gap-1 sm:gap-2">
                <ProjectLogo className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8" />
                <div className="flex flex-col">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-5" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:gap-10 md:flex-1 md:grid-cols-2">
              <div className="space-y-3" />
              <div className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-32" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="my-5 max-w-lg space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </footer>
    </div>
  );
}
