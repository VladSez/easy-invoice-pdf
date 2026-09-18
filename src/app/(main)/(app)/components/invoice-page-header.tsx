"use client";

import { LinkIcon } from "lucide-react";
import { useState } from "react";

import { ProjectLogoDescription } from "@/app/(components)/project-logo-description";
import { HowItWorksVideoDialog } from "@/app/(main)/(app)/components/how-it-works-video-dialog";
import { InvoicePDFDownloadLink } from "@/app/(main)/(app)/components/invoice-pdf-download-link";
import { SendInvoiceFeature } from "@/app/(main)/(app)/components/send-invoice/send-invoice-dialog";
import { ShareInvoiceButton } from "@/app/(main)/(app)/components/share-invoice-button";
import { type InvoiceData } from "@/app/schema";
import { UserAccountButton } from "@/components/auth/user-account-button";
import { GithubIcon } from "@/components/etc/github-logo";
import { ProjectLogo } from "@/components/etc/project-logo";
import { CustomTooltip } from "@/components/ui/tooltip";
import { DISCORD_COMMUNITY_URL, GITHUB_URL } from "@/config";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

/**
 * Header component for the invoice page.
 *
 * Displays the project logo, description, and action buttons including:
 * - Share invoice button (with conditional rendering based on shareability)
 * - Download PDF button
 * @returns The rendered invoice page header with logo, description, and action buttons
 */
export function InvoicePageHeader({
  canShareInvoice,
  handleShareInvoice,
  isDesktop,
  invoiceDataState,
  isMobile,
  isSharedInvoice,
  qrCodeDataUrl,
}: {
  canShareInvoice: boolean;
  handleShareInvoice: () => void;
  isDesktop: boolean;
  invoiceDataState: InvoiceData;
  isMobile: boolean;
  isSharedInvoice: boolean;
  qrCodeDataUrl: string;
}) {
  return (
    <div data-testid="header">
      <p className="sr-only">
        Free & open-source. Create and download PDF invoices instantly - no
        signup required.
      </p>
      <div className="flex w-full flex-row flex-wrap items-center justify-between lg:flex-nowrap">
        <div className="relative bottom-2 mt-2 flex w-full flex-col justify-center sm:bottom-4 sm:mt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ProjectLogo className="h-8 w-8" />
              <ProjectLogoDescription
                title={
                  <h1 className="text-balance text-xl font-bold text-slate-800 lg:text-2xl">
                    EasyInvoicePDF
                  </h1>
                }
                description={
                  <h2 className="text-balance text-[12px] text-slate-700 sm:text-[13px]">
                    Free & Open-Source Invoice Generator
                  </h2>
                }
              />
            </div>
            {isMobile ? <UserAccountButton /> : null}
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

          {/* On mobile version, we show it in different place (bottom of the page)*/}
          {isDesktop ? (
            <>
              <UserAccountButton />
              <ShareInvoiceButton
                canShareInvoice={canShareInvoice}
                handleShareInvoice={handleShareInvoice}
                className="mx-2 mb-2 w-full lg:mx-0 lg:mb-0 lg:w-auto"
              />
              <SendInvoiceFeature
                invoiceData={invoiceDataState}
                qrCodeDataUrl={qrCodeDataUrl}
              />
              <InvoicePDFDownloadLink
                invoiceData={invoiceDataState}
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
          href={DISCORD_COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center transition duration-200 hover:text-blue-600 hover:underline active:scale-[0.96]"
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

      <HowItWorksVideoDialog
        open={isVideoDialogOpen}
        onOpenChange={setIsVideoDialogOpen}
      />
    </>
  );
}
