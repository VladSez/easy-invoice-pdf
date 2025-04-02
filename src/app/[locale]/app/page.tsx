"use client";

import { invoiceSchema, type InvoiceData } from "@/app/schema";
import { Button } from "@/components/ui/button";
import { CustomTooltip, TooltipProvider } from "@/components/ui/tooltip";
import { isLocalStorageAvailable } from "@/lib/check-local-storage";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import * as Sentry from "@sentry/nextjs";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { InvoiceClientPage } from "../../components";
import { PDF_DATA_LOCAL_STORAGE_KEY } from "../../components/invoice-form";
import { InvoicePDFDownloadLink } from "../../components/invoice-pdf-download-link";
import { INITIAL_INVOICE_DATA } from "../../constants";
import { useDeviceContext } from "@/contexts/device-context";
import { Link } from "@/i18n/navigation";
import { ProjectLogo } from "@/components/etc/project-logo";
import { GithubIcon } from "@/components/etc/github-logo";
// import { InvoicePDFDownloadMultipleLanguages } from "./components/invoice-pdf-download-multiple-languages";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isDesktop } = useDeviceContext();
  const isMobile = !isDesktop;

  const [invoiceDataState, setInvoiceDataState] = useState<InvoiceData | null>(
    null
  );

  // Initialize data from URL or localStorage on mount
  useEffect(() => {
    const compressedInvoiceDataInUrl = searchParams.get("data");

    // first try to load from url
    if (compressedInvoiceDataInUrl) {
      try {
        const decompressed = decompressFromEncodedURIComponent(
          compressedInvoiceDataInUrl
        );
        const parsed: unknown = JSON.parse(decompressed);
        const validated = invoiceSchema.parse(parsed);

        setInvoiceDataState(validated);
      } catch (error) {
        // fallback to local storage
        console.error("Failed to parse URL data:", error);
        loadFromLocalStorage();

        Sentry.captureException(error);
      }
    } else {
      // if no data in url, load from local storage
      loadFromLocalStorage();
    }
  }, [searchParams]);

  // Helper function to load from localStorage
  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem(PDF_DATA_LOCAL_STORAGE_KEY);
      if (savedData) {
        const json: unknown = JSON.parse(savedData);
        const parsedData = invoiceSchema.parse(json);

        setInvoiceDataState(parsedData);
      } else {
        // if no data in local storage, set initial data
        setInvoiceDataState(INITIAL_INVOICE_DATA);
      }
    } catch (error) {
      console.error("Failed to load saved invoice data:", error);

      setInvoiceDataState(INITIAL_INVOICE_DATA);

      Sentry.captureException(error);
    }
  };

  // Save to localStorage whenever data changes on form update
  useEffect(() => {
    // Only save to localStorage if it's available
    if (invoiceDataState && isLocalStorageAvailable) {
      try {
        const newInvoiceDataValidated = invoiceSchema.parse(invoiceDataState);

        localStorage.setItem(
          PDF_DATA_LOCAL_STORAGE_KEY,
          JSON.stringify(newInvoiceDataValidated)
        );

        // Check if URL has data and current data is different
        const urlData = searchParams.get("data");

        if (urlData) {
          try {
            const decompressed = decompressFromEncodedURIComponent(urlData);
            const urlParsed: unknown = JSON.parse(decompressed);

            const urlValidated = invoiceSchema.parse(urlParsed);

            if (
              JSON.stringify(urlValidated) !==
              JSON.stringify(newInvoiceDataValidated)
            ) {
              toast.info(
                <p className="text-pretty text-sm leading-relaxed">
                  <span className="font-semibold text-blue-600">
                    Invoice Updated:
                  </span>{" "}
                  Your changes have modified this invoice from its shared
                  version. Click{" "}
                  <span className="font-semibold">
                    &apos;Generate a link to invoice&apos;
                  </span>{" "}
                  button to create an updated shareable link.
                </p>,
                {
                  duration: 10000,
                  closeButton: true,
                  richColors: true,
                }
              );

              // Clean URL if data differs
              router.replace("/");
            }
          } catch (error) {
            console.error("Failed to compare with URL data:", error);

            Sentry.captureException(error);
          }
        }
      } catch (error) {
        console.error("Failed to save invoice data:", error);
        toast.error("Failed to save invoice data");

        Sentry.captureException(error);
      }
    }
  }, [invoiceDataState, router, searchParams]);

  const handleInvoiceDataChange = (updatedData: InvoiceData) => {
    setInvoiceDataState(updatedData);
  };

  const handleShareInvoice = async () => {
    if (invoiceDataState) {
      try {
        const newInvoiceDataValidated = invoiceSchema.parse(invoiceDataState);
        const stringified = JSON.stringify(newInvoiceDataValidated);
        const compressed = compressToEncodedURIComponent(stringified);

        // Use push instead of replace to maintain history
        router.push(`/?data=${compressed}`);

        const newFullUrl = `${window.location.origin}/?data=${compressed}`;
        await navigator.clipboard.writeText(newFullUrl);

        toast.success("Invoice link copied to clipboard!", {
          description:
            "Share this link to let others view and edit this invoice",
        });

        // analytics track event
        umamiTrackEvent("share_invoice_link");
      } catch (error) {
        console.error("Failed to share invoice:", error);
        toast.error("Failed to generate shareable link");

        Sentry.captureException(error);
      }
    }
  };

  // we only want to render the page on client side
  if (!invoiceDataState) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 sm:p-4">
        <div className="w-full max-w-7xl bg-white p-3 shadow-lg sm:mb-0 sm:rounded-lg sm:p-6">
          <div className="flex w-full flex-row flex-wrap items-center justify-between lg:flex-nowrap">
            <div className="relative bottom-3 mt-3 flex flex-col items-center justify-center sm:mt-0">
              <div className="flex items-center">
                <ProjectLogo className="h-8 w-8" />
                <p className="text-balance text-center text-xl font-bold text-slate-800 sm:mt-0 sm:text-2xl lg:mr-5 lg:text-left">
                  <a
                    href="https://easyinvoicepdf.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    EasyInvoicePDF.com
                  </a>
                </p>
              </div>
              <p className="relative bottom-1.5 left-[49px] text-[12px] text-slate-700">
                Invoice PDF generator with live preview
              </p>
            </div>

            <div className="mb-1 flex w-full flex-wrap justify-center gap-3 lg:flex-nowrap lg:justify-end">
              <Button
                className="mx-2 w-full bg-blue-500 text-white transition-all hover:scale-105 hover:bg-blue-600 hover:no-underline lg:mx-0 lg:w-auto"
                _variant="link"
                onClick={() => {
                  window.open(
                    "https://dub.sh/easyinvoice-donate",
                    "_blank",
                    "noopener noreferrer"
                  );

                  // analytics track event
                  umamiTrackEvent("donate_to_project_button_clicked_header");
                }}
              >
                <span className="flex items-center space-x-1.5">
                  <span className="animate-heartbeat">❤️</span>
                  <span>Support Project</span>
                </span>
              </Button>

              {isDesktop ? (
                <>
                  <CustomTooltip
                    trigger={
                      <Button
                        onClick={handleShareInvoice}
                        _variant="outline"
                        className="mx-2 mb-2 w-full lg:mx-0 lg:mb-0 lg:w-auto"
                      >
                        Generate a link to invoice
                      </Button>
                    }
                    content="Generate a shareable link to this invoice. Share it with your clients to allow them to view the invoice online."
                  />
                  <InvoicePDFDownloadLink invoiceData={invoiceDataState} />
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
          <div className="mb-3 mt-2 flex flex-row items-center justify-center lg:mb-0 lg:mt-4 lg:justify-start xl:mt-0">
            <ProjectInfo />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <InvoiceClientPage
              invoiceDataState={invoiceDataState}
              handleInvoiceDataChange={handleInvoiceDataChange}
              handleShareInvoice={handleShareInvoice}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ProjectInfo() {
  return (
    <>
      <span className="relative bottom-0 text-center text-sm text-gray-900 lg:bottom-3">
        Made by{" "}
        <a
          href="https://dub.sh/vldzn.me"
          className="underline transition-colors hover:text-blue-600"
          target="_blank"
        >
          Vlad Sazonau
        </a>
        {" | "}
        <a
          href="https://github.com/VladSez/pdf-invoice-generator"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2"
          title="View on GitHub"
        >
          <span className="transition-all group-hover:text-blue-600 group-hover:underline">
            Open Source
          </span>
          <GithubIcon />
        </a>
        {" | "}
        <a
          href="https://dub.sh/easy-invoice-pdf-feedback"
          className="transition-colors hover:text-blue-600 hover:underline"
          target="_blank"
        >
          Share your feedback
        </a>
        {" | "}
        <Link
          href="/about"
          className="transition-colors hover:text-blue-600 hover:underline"
        >
          About
        </Link>
      </span>
    </>
  );
}
