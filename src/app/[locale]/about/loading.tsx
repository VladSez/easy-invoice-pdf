import { Footer } from "@/app/(components)/footer";
import { HeaderSkeleton } from "@/app/(components)/header/header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AboutLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <HeaderSkeleton />

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

        {/* FAQ Section */}
        <section className="flex w-full items-center justify-center bg-white py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-full space-y-2">
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
            <div className="flex flex-col items-center justify-center space-y-4">
              <Skeleton className="h-4 w-[200px]" />
              <div className="flex w-full flex-col items-center justify-center gap-6">
                <div className="flex gap-2">
                  <Skeleton className="h-11 w-[160px]" />
                  <Skeleton className="h-11 w-[160px]" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
