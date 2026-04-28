"use client";

import { type InvoiceData } from "@/app/schema";
import { ProjectLogo } from "@/components/etc/project-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomTooltip } from "@/components/ui/tooltip";
import Link from "next/link";

import { GithubIcon } from "@/components/etc/github-logo";
import { ProjectLogoDescription } from "@/app/(components)/project-logo-description";
import { GITHUB_URL, VIDEO_DEMO_YOUTUBE_URL } from "@/config";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";
import { AlertCircleIcon, HeartIcon, LinkIcon } from "lucide-react";
import { useState } from "react";
import { InvoicePDFDownloadLink } from "@/app/(app)/components/invoice-pdf-download-link";

/**
 * Header component for the invoice page.
 * 
 * Displays the project logo, description, and action buttons including:
 * - Share invoice button (with conditional rendering based on shareability)
 * - Download PDF button with error handling
 * - Support project button

 * @returns The rendered invoice page header with logo, description, and action buttons
 */
export function InvoicePageHeader({
  canShareInvoice,
  handleShareInvoice,
  isDesktop,
  invoiceDataState,
  errorWhileGeneratingPdfIsShown,
  setErrorWhileGeneratingPdfIsShown,
  qrCodeDataUrl,
  isMobile,
  isSharedInvoice,
}: {
  canShareInvoice: boolean;
  handleShareInvoice: () => void;
  isDesktop: boolean;
  invoiceDataState: InvoiceData;
  errorWhileGeneratingPdfIsShown: boolean;
  setErrorWhileGeneratingPdfIsShown: (value: boolean) => void;
  qrCodeDataUrl: string;
  isMobile: boolean;
  isSharedInvoice: boolean;
}) {
  return (
    <div data-testid="header">
      <div className="flex w-full flex-row flex-wrap items-center justify-between lg:flex-nowrap">
        <div className="relative bottom-2 mt-2 flex w-full flex-col justify-center sm:bottom-4 sm:mt-0">
          <div className="flex items-center">
            <ProjectLogo className="h-8 w-8" />

            <ProjectLogoDescription>
              Free Invoice Generator with Live PDF Preview
            </ProjectLogoDescription>
          </div>
        </div>
        {/* desktop only section (hidden on mobile) */}
        <div className="mb-1 hidden w-full flex-wrap justify-center gap-3 lg:flex lg:flex-nowrap lg:justify-end">
          {isSharedInvoice && isDesktop ? (
            <CustomTooltip
              trigger={
                <span
                  data-testid="shared-invoice-badge"
                  className="flex w-[115px] items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 shadow duration-500 animate-in fade-in slide-in-from-top-2"
                >
                  <LinkIcon className="size-3" />
                  Shared invoice
                </span>
              }
              content={"Viewing shared invoice"}
            />
          ) : null}
          {/* Support project button (hidden on mobile) */}
          <Button
            asChild
            variant="outline"
            className="group mx-2 w-full border-pink-200 bg-pink-50 text-pink-700 shadow-md transition-all duration-200 hover:border-pink-300 hover:bg-pink-100 hover:text-pink-800 hover:no-underline hover:shadow-lg focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 lg:mx-0 lg:inline-flex lg:w-auto"
            onClick={() => {
              // analytics track event
              umamiTrackEvent("donate_to_project_button_clicked_header");
            }}
          >
            <Link
              href="https://dub.sh/easyinvoice-donate"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              Support Project
              <div className="relative select-none">
                <HeartIcon className="size-3 scale-110 fill-pink-500 text-pink-500 transition-all duration-200 group-hover:fill-pink-600 group-hover:text-pink-600" />
                <HeartIcon
                  className={cn(
                    "size-3 animate-ping fill-pink-500 text-pink-500 duration-1000 group-hover:fill-pink-600",
                    "absolute inset-0 flex",
                  )}
                />
              </div>
            </Link>
          </Button>

          {/* On mobile version, we show it in different place (bottom of the page)*/}
          {isDesktop ? (
            <>
              <CustomTooltip
                className={cn(!canShareInvoice && "bg-red-50")}
                trigger={
                  <Button
                    data-disabled={!canShareInvoice} // better UX than 'disabled'
                    onClick={handleShareInvoice}
                    variant="outline"
                    className={cn("mx-2 mb-2 w-full lg:mx-0 lg:mb-0 lg:w-auto")}
                  >
                    Generate invoice link
                  </Button>
                }
                content={
                  canShareInvoice ? (
                    <div className="flex items-center gap-3 p-2">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Share Invoice Online
                        </p>
                        <p className="text-pretty text-xs leading-relaxed text-slate-700">
                          Generate a link to share this invoice with your
                          clients. They can view and download it directly from
                          their browser.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      data-testid="share-invoice-tooltip-content"
                      className="flex items-center gap-3 bg-red-50 p-3"
                    >
                      <AlertCircleIcon className="h-5 w-5 flex-shrink-0 fill-red-600 text-white" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-red-800">
                          Unable to Share Invoice
                        </p>
                        <p className="text-pretty text-xs leading-relaxed text-red-700">
                          Invoices with logos cannot be shared. Please remove
                          the logo to generate a shareable link. You can still
                          download the invoice as PDF and share it.
                        </p>
                      </div>
                    </div>
                  )
                }
              />
              <InvoicePDFDownloadLink
                invoiceData={invoiceDataState}
                errorWhileGeneratingPdfIsShown={errorWhileGeneratingPdfIsShown}
                setErrorWhileGeneratingPdfIsShown={
                  setErrorWhileGeneratingPdfIsShown
                }
                qrCodeDataUrl={qrCodeDataUrl}
                isMobile={isMobile}
              />
            </>
          ) : null}

          {/* TODO: add later when PRO version is released, this is PRO FEATURE =) */}
          {/* {isDesktop ? (
              <InvoicePDFDownloadMultipleLanguages
                invoiceData={invoiceDataState}
              />
            ) : null} */}
        </div>
      </div>
      <div className="mb-2.5 flex flex-row items-center justify-center lg:-mb-1.5 lg:mt-4 lg:justify-start xl:mt-1">
        <ProjectInfoLinks />
      </div>

      {/* mobile only section (hidden on desktop) */}
      {isSharedInvoice && isMobile ? (
        <div className="mb-3 flex flex-row items-center justify-center">
          <span
            data-testid="shared-invoice-badge"
            className="flex w-[115px] items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 shadow duration-500 animate-in fade-in slide-in-from-top-2"
          >
            <LinkIcon className="size-3" />
            Shared invoice
          </span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Renders project information links including demo video, feedback, and GitHub links.
 * Manages video dialog state for the "How it works" demo.
 */
function ProjectInfoLinks() {
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  const handleWatchDemoClick = () => {
    setIsVideoDialogOpen(true);
    umamiTrackEvent("watch_demo_button_clicked");
  };

  return (
    <>
      <div className="relative bottom-0 flex flex-wrap items-center justify-center gap-1.5 text-center text-sm text-gray-900 lg:bottom-4">
        <button
          onClick={handleWatchDemoClick}
          className="inline-flex cursor-pointer items-center transition duration-200 hover:text-blue-600 hover:underline active:scale-[0.96]"
        >
          How it works
        </button>
        <span className="h-3 w-px bg-slate-500" aria-hidden="true" />
        <a
          href="https://dub.sh/easy-invoice-pdf-feedback"
          className="inline-flex items-center transition duration-200 hover:text-blue-600 hover:underline active:scale-[0.96]"
          target="_blank"
        >
          Share your feedback
        </a>
        <span className="h-3 w-px bg-slate-500" aria-hidden="true" />

        <div className="relative overflow-hidden">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-1.5 overflow-visible rounded-full border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm transition-[colors,transform,border-color] duration-200 hover:border-slate-400/50 hover:bg-slate-50 hover:text-black active:scale-[0.96]"
          >
            <div className="border-glow-mask z-10" aria-hidden="true">
              <div className="border-glow-shine animate-rotate-shine" />
            </div>
            <GithubIcon className="size-4 transition-[transform,fill] duration-200 group-hover:scale-105 group-hover:fill-blue-600" />
            <span className="transition-colors duration-200 group-hover:text-blue-600">
              Star on GitHub
            </span>
          </a>
        </div>
      </div>

      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[800px]">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>How EasyInvoicePDF Works</DialogTitle>
            <DialogDescription>
              Watch this quick demo to learn how to create and customize your
              invoices.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full overflow-hidden">
            <iframe
              src={VIDEO_DEMO_YOUTUBE_URL}
              title="EasyInvoicePDF Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="h-full w-full border-0"
              data-testid="how-it-works-video"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
