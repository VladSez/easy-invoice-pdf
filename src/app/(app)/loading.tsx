import { Footer } from "@/app/(components)/footer";
import { ProjectLogoDescription } from "@/app/(components)/project-logo-description";
import { ProjectLogo } from "@/components/etc/project-logo";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <InvoicePageLoadingSkeleton />;
}

/**
 * Displays the loading skeleton for the Invoice Page.
 * Shows placeholders for the header, invoice editor, and footer while content is being loaded.
 */
export function InvoicePageLoadingSkeleton() {
  return (
    <>
      <div
        className="flex flex-col items-center justify-start bg-gray-100 pb-4 sm:p-4 md:justify-center lg:min-h-screen"
        aria-busy="true"
        aria-label="Loading invoice editor"
      >
        <div className="w-full max-w-[62rem] bg-white p-3 shadow-lg sm:mb-0 sm:rounded-lg sm:p-6 sm:pb-1 min-[1400px]:max-w-7xl 2xl:max-w-[1480px]">
          <LoadingHeader />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <MobileEditorLoading />
            <DesktopEditorLoading />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function LoadingHeader() {
  return (
    <div className="lg:mb-0 lg:h-auto">
      <div className="flex w-full flex-row flex-wrap items-center justify-between lg:flex-nowrap">
        <div className="relative bottom-2 mt-2 flex w-full flex-col justify-center sm:bottom-4 sm:mt-0">
          <div className="flex items-center">
            <ProjectLogo className="h-8 w-8" />
            <ProjectLogoDescription
              description={
                <h2 className="text-balance text-[12px] text-slate-700 sm:text-[13px]">
                  Free &amp; Open-Source Invoice Generator
                </h2>
              }
            />
          </div>
        </div>

        {/* Desktop Buttons skeleton Share Invoice and Download PDF */}
        <div className="mb-1 hidden w-full flex-nowrap justify-end gap-3 lg:flex">
          {/* Share Invoice (Get link) */}
          <Skeleton className="h-9 w-[106px]" />
          {/* Download PDF */}
          <Skeleton className="h-9 w-[230px]" />
        </div>
      </div>

      {/* Links */}
      <div className="mb-2.5 flex flex-row items-center justify-center lg:-mb-1.5 lg:mt-4 lg:justify-start xl:mt-1">
        <div className="relative flex min-h-[26px] flex-wrap items-center justify-center gap-1.5 lg:bottom-4 lg:min-h-7 lg:flex-nowrap">
          <Skeleton className="h-[18px] w-[100px] rounded-full bg-slate-100" />
          <Skeleton className="h-[18px] w-[100px] rounded-full bg-slate-100" />
          <Skeleton className="h-[18px] w-[100px] rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function MobileEditorLoading() {
  return (
    <div className="min-h-[814px] lg:hidden">
      <div className="mx-3">
        <div className="mt-1 h-[520px] overflow-hidden rounded-lg border px-4 shadow-sm">
          <FormLoadingContent />
        </div>
      </div>

      {/*
        Mirrors the dock in `InvoiceClientPage`: the Edit / Preview switch sits inside it,
        above the two buttons, as a pill track with the indicator on the active tab.
      */}
      <div className="sticky bottom-0 z-50 mt-2 flex flex-col items-center justify-center gap-3 rounded-lg border border-t border-gray-200 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex h-10 w-full items-center rounded-full bg-slate-200 p-1">
          <div className="flex h-8 flex-1 items-center justify-center rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.06)]">
            <Skeleton className="h-3 w-[86px] bg-slate-200" />
          </div>
          <div className="flex h-8 flex-1 items-center justify-center">
            <Skeleton className="h-3 w-[86px] bg-slate-300" />
          </div>
        </div>
        <Skeleton className="h-9 w-full bg-slate-100" />
        <Skeleton className="h-9 w-full bg-slate-100" />
      </div>

      <div className="mt-2 flex h-4 flex-wrap items-center justify-center gap-1.5">
        <Skeleton className="h-3 w-[180px]" />
        <Skeleton className="h-3 w-[225px]" />
      </div>
    </div>
  );
}

function DesktopEditorLoading() {
  return (
    <>
      <div className="col-span-4 -mt-0.5 mb-7 mr-[27px] hidden lg:block">
        <div className="rounded-t-lg border shadow">
          <div className="h-[618px] overflow-hidden px-4 pb-4 pt-0 2xl:h-[700px]">
            <FormLoadingContent />
          </div>
        </div>
      </div>

      <div className="relative col-span-8 hidden h-[620px] w-full max-w-full lg:block 2xl:h-[700px]">
        <div className="flex h-full items-center justify-center overflow-hidden rounded-sm border border-slate-200 bg-slate-100">
          <div className="h-[92%] w-[68%] rounded-sm bg-white shadow-sm">
            <div className="space-y-4 p-8">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="mt-10 h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="mt-8 h-32 w-full" />
            </div>
          </div>
        </div>
        <Skeleton className="absolute -bottom-5 right-0 h-3 w-[254px]" />
      </div>
    </>
  );
}

function FormLoadingContent() {
  return (
    <div className="space-y-4 py-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-[190px]" />
        <Skeleton className="size-6 shrink-0 rounded-full" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => {
        return (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-full bg-slate-100" />
            <Skeleton className="h-2.5 w-4/5" />
          </div>
        );
      })}
      <div className="rounded-md border border-slate-200 p-4">
        <Skeleton className="mb-4 h-5 w-36" />
        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-full bg-slate-100" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-9 w-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
