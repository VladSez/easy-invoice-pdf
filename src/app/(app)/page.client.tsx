"use client";

import { INITIAL_INVOICE_DATA } from "@/app/constants";
import {
  invoiceSchema,
  PDF_DATA_LOCAL_STORAGE_KEY,
  SUPPORTED_TEMPLATES,
  type InvoiceData,
} from "@/app/schema";
import { ProjectLogo } from "@/components/etc/project-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomTooltip, TooltipProvider } from "@/components/ui/tooltip";
import { useDeviceContext } from "@/contexts/device-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Footer } from "@/components/footer";
import { GitHubStarCTA } from "@/components/github-star-cta";
import { ProjectLogoDescription } from "@/components/project-logo-description";
import { GITHUB_URL, VIDEO_DEMO_URL } from "@/config";
import { isLocalStorageAvailable } from "@/lib/check-local-storage";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";
import { AlertCircleIcon } from "lucide-react";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import {
  compressInvoiceData,
  decompressInvoiceData,
} from "@/utils/url-compression";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { InvoiceClientPage } from "./components";
import {
  customDefaultToast,
  customPremiumToast,
} from "./components/cta-toasts";
import { InvoicePDFDownloadLink } from "./components/invoice-pdf-download-link";
import { handleInvoiceNumberBreakingChange } from "./utils/invoice-number-breaking-change";
// import { DevLocalStorageView } from "./components/dev/dev-local-storage-view";
// import { InvoicePDFDownloadMultipleLanguages } from "./components/invoice-pdf-download-multiple-languages";

const DevLocalStorageView = dynamic(
  () =>
    import("./components/dev/dev-local-storage-view").then(
      (mod) => mod.DevLocalStorageView,
    ),
  { ssr: false },
);

export function AppPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlTemplateSearchParam = searchParams.get("template");

  // Validate template parameter with zod
  const templateValidation = z
    .enum(SUPPORTED_TEMPLATES)
    .default("default")
    .safeParse(urlTemplateSearchParam);

  const { isDesktop } = useDeviceContext();
  const isMobile = !isDesktop;

  const [invoiceDataState, setInvoiceDataState] = useState<InvoiceData | null>(
    null,
  );

  const [errorWhileGeneratingPdfIsShown, setErrorWhileGeneratingPdfIsShown] =
    useState(false);

  const [canShareInvoice, setCanShareInvoice] = useState(true);

  // Helper function to load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(PDF_DATA_LOCAL_STORAGE_KEY);

      if (savedData) {
        const json: unknown = JSON.parse(savedData);

        // this should happen before parsing the data with zod
        const updatedJson = handleInvoiceNumberBreakingChange(json);

        const parsedData = invoiceSchema.parse(updatedJson);

        // if template is in url, use it
        if (templateValidation.success) {
          parsedData.template = templateValidation.data;
        }

        setInvoiceDataState(parsedData);
      } else {
        if (templateValidation.success) {
          // if no data in local storage and template is in url, set initial data with template from url
          setInvoiceDataState({
            ...INITIAL_INVOICE_DATA,
            template: templateValidation.data,
          });
        } else {
          // if no data in local storage, set initial data
          setInvoiceDataState(INITIAL_INVOICE_DATA);
        }
      }
    } catch (error) {
      console.error("Failed to load saved invoice data:", error);

      setInvoiceDataState(INITIAL_INVOICE_DATA);

      toast.error(
        "Unable to load your saved invoice data. For your convenience, we've reset the form to default values. Please try creating a new invoice.",
        {
          duration: 20000,
          closeButton: true,
          richColors: true,
        },
      );

      Sentry.captureException(error);
    }
  }, [templateValidation.data, templateValidation.success]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Initialize data from URL or localStorage on mount
  useEffect(() => {
    const compressedInvoiceDataInUrl = searchParams.get("data");
    const urlTemplateSearchParam = searchParams.get("template");

    // Validate template parameter with zod
    const templateValidation = z
      .enum(SUPPORTED_TEMPLATES)
      .default("default")
      .safeParse(urlTemplateSearchParam);

    // first try to load from url
    if (compressedInvoiceDataInUrl) {
      try {
        const decompressed = decompressFromEncodedURIComponent(
          compressedInvoiceDataInUrl,
        );

        const parsedJSON: unknown = JSON.parse(decompressed);

        // Restore original keys from compressed format, we store keys in compressed format to reduce URL size i.e. {name: "John Doe"} -> {n: "John Doe"}
        const decompressedKeys = decompressInvoiceData(
          parsedJSON as Record<string, unknown>,
        );

        // this should happen before parsing the data with zod
        const updatedJson = handleInvoiceNumberBreakingChange(decompressedKeys);

        const validated = invoiceSchema.parse(updatedJson);

        if (templateValidation.success) {
          validated.template = templateValidation.data;
        }

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
  }, [loadFromLocalStorage, searchParams]);

  // Save to localStorage whenever data changes on form update
  useEffect(() => {
    // Only save to localStorage if it's available
    if (invoiceDataState && isLocalStorageAvailable) {
      try {
        const newInvoiceDataValidated = invoiceSchema.parse(invoiceDataState);

        localStorage.setItem(
          PDF_DATA_LOCAL_STORAGE_KEY,
          JSON.stringify(newInvoiceDataValidated),
        );

        // Update template in search params if it exists

        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("template", newInvoiceDataValidated.template);
        router.replace(`/?${newSearchParams.toString()}`);

        // Check if URL has data i.e. if user has shared invoice link
        const urlData = searchParams.get("data");

        if (urlData) {
          try {
            const decompressed = decompressFromEncodedURIComponent(urlData);

            const urlParsed: unknown = JSON.parse(decompressed);

            // Restore original keys from compressed format
            const decompressedKeys = decompressInvoiceData(
              urlParsed as Record<string, unknown>,
            );

            const urlValidated = invoiceSchema.parse(decompressedKeys);

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
                },
              );

              // Clean URL if data differs
              router.replace("/");
            }
          } catch (error) {
            console.error("Failed to compare with URL data:", error);

            // TODO: move to 'Initialize data from URL or localStorage on mount' useEffect?
            toast.error("The shared invoice URL appears to be incorrect", {
              id: "invalid-invoice-url-error-toast", // prevent duplicate toasts
              description: (
                <div className="flex flex-col gap-2">
                  <p className="">
                    Please verify that you have copied the complete invoice URL.
                    The link may be truncated or corrupted.
                  </p>
                  <Button
                    _variant="outline"
                    _size="sm"
                    onClick={() => {
                      router.replace("/?template=default");
                      toast.dismiss();
                    }}
                  >
                    Clear URL
                  </Button>
                </div>
              ),
              duration: 20000,
              closeButton: true,
            });

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

  // Show CTA toast every minute
  useEffect(() => {
    // only show on production
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const showCTAToast = () => {
      // Randomly show either default or premium donation toast
      if (Math.random() <= 0.5) {
        customPremiumToast({
          title: "Support My Work",
          description:
            "Your contribution helps me maintain and improve this project for everyone! 🚀",
          showDonationButton: false,
        });
      } else {
        customDefaultToast({
          title: "Love this project?",
          description:
            "Help me keep building amazing tools! Your support means the world to me. ✨",
          showDonationButton: false,
        });
      }
    };

    // Show cta toast after 50 seconds on the app page
    const initialTimer = setTimeout(showCTAToast, 50_000);

    return () => {
      clearTimeout(initialTimer);
    };
  }, []);

  const handleInvoiceDataChange = (updatedData: InvoiceData) => {
    setInvoiceDataState(updatedData);
  };

  const handleShareInvoice = async () => {
    if (!canShareInvoice) {
      toast.error("Unable to Share Invoice", {
        duration: 5000,
        description: (
          <>
            <p className="text-pretty text-xs leading-relaxed text-red-700">
              Invoices with logos cannot be shared. Please remove the logo to
              generate a shareable link. You can still download the invoice as
              PDF and share it.
            </p>
          </>
        ),
      });

      return;
    }

    if (invoiceDataState) {
      try {
        const newInvoiceDataValidated = invoiceSchema.parse(invoiceDataState);

        // Compress JSON keys before stringifying to reduce URL size
        const compressedKeys = compressInvoiceData(newInvoiceDataValidated);
        const compressedJson = JSON.stringify(compressedKeys);

        const compressedData = compressToEncodedURIComponent(compressedJson);

        // Check if the compressed data length exceeds browser URL limits
        // Most browsers have a limit around 2000 characters for URLs
        // With key compression, we can fit much larger invoices within this limit
        const URL_LENGTH_LIMIT = 2000;
        const estimatedUrlLength =
          window.location.origin.length + 7 + compressedData.length; // 7 for "/?data="

        if (estimatedUrlLength > URL_LENGTH_LIMIT) {
          toast.error("Invoice data is too large to share via URL", {
            description: "Try removing some items or simplifying the invoice",
          });
          return;
        }

        router.push(
          `/?template=${newInvoiceDataValidated.template}&data=${compressedData}`,
        );

        // Construct full URL with locale and compressed data
        const newFullUrl = `${window.location.origin}/?template=${newInvoiceDataValidated.template}&data=${compressedData}`;

        // Copy to clipboard
        await navigator.clipboard.writeText(newFullUrl);

        // Dismiss any existing toast before showing new one
        toast.dismiss();

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
      {process.env.NEXT_PUBLIC_DEBUG_LOCAL_STORAGE_UI === "true" && (
        <DevLocalStorageView />
      )}

      <div className="flex flex-col items-center justify-start bg-gray-100 pb-4 sm:p-4 md:justify-center lg:min-h-screen">
        <div className="w-full max-w-7xl bg-white p-3 shadow-lg sm:mb-0 sm:rounded-lg sm:p-6 2xl:max-w-[1680px]">
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
              <div className="mb-1 flex w-full flex-wrap justify-center gap-3 lg:flex-nowrap lg:justify-end">
                <Button
                  asChild
                  className="mx-2 w-full bg-blue-500 text-white transition-all hover:no-underline hover:opacity-90 lg:mx-0 lg:w-auto"
                  _variant="link"
                  onClick={() => {
                    // analytics track event
                    umamiTrackEvent("donate_to_project_button_clicked_header");
                  }}
                >
                  <Link
                    href="https://dub.sh/easyinvoice-donate"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="flex items-center space-x-1.5">
                      <span className="animate-heartbeat">❤️</span>
                      <span>Support Project</span>
                    </span>
                  </Link>
                </Button>

                {isDesktop ? (
                  <>
                    <CustomTooltip
                      className={cn(!canShareInvoice && "bg-red-50")}
                      trigger={
                        <Button
                          data-disabled={!canShareInvoice} // better UX than 'disabled'
                          onClick={handleShareInvoice}
                          _variant="outline"
                          className={cn(
                            "mx-2 mb-2 w-full lg:mx-0 lg:mb-0 lg:w-auto",
                          )}
                        >
                          Generate a link to invoice
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
                                Generate a secure link to share this invoice
                                with your clients. They can view and download it
                                directly from their browser.
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
                                Invoices with logos cannot be shared. Please
                                remove the logo to generate a shareable link.
                                You can still download the invoice as PDF and
                                share it.
                              </p>
                            </div>
                          </div>
                        )
                      }
                    />
                    <InvoicePDFDownloadLink
                      invoiceData={invoiceDataState}
                      errorWhileGeneratingPdfIsShown={
                        errorWhileGeneratingPdfIsShown
                      }
                      setErrorWhileGeneratingPdfIsShown={
                        setErrorWhileGeneratingPdfIsShown
                      }
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
            <div className="mb-3 mt-2 flex flex-row items-center justify-center lg:mb-0 lg:mt-4 lg:justify-start xl:mt-1">
              <ProjectInfo />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <InvoiceClientPage
              invoiceDataState={invoiceDataState}
              handleInvoiceDataChange={handleInvoiceDataChange}
              handleShareInvoice={handleShareInvoice}
              isMobile={isMobile}
              errorWhileGeneratingPdfIsShown={errorWhileGeneratingPdfIsShown}
              setErrorWhileGeneratingPdfIsShown={
                setErrorWhileGeneratingPdfIsShown
              }
              canShareInvoice={canShareInvoice}
              setCanShareInvoice={setCanShareInvoice}
            />
          </div>
        </div>
      </div>
      <Footer
        translations={{
          footerDescription:
            "A free, open-source tool for creating professional invoices with real-time preview.",
          footerCreatedBy: "Created by",
          product: "Product",

          newsletterTitle: "Subscribe to our newsletter",
          newsletterDescription:
            "Get the latest updates and news from EasyInvoicePDF.com",
          newsletterSubscribe: "Subscribe",
          newsletterPlaceholder: "Enter your email",
          newsletterSuccessMessage: "Thank you for subscribing!",
          newsletterErrorMessage: "Failed to subscribe. Please try again.",
          newsletterEmailLanguageInfo: "All emails will be sent in English",
        }}
        links={
          <ul className="space-y-2">
            <li>
              <Link
                href="/en/about"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/changelog"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                Changelog
              </Link>
            </li>
            <li>
              <Link
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                GitHub
              </Link>
            </li>
            <li>
              <Link
                href="https://pdfinvoicegenerator.userjot.com/?cursor=1&order=top&limit=10"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                Share feedback
              </Link>
            </li>
          </ul>
        }
      />
      <GitHubStarCTA />
    </TooltipProvider>
  );
}

function ProjectInfo() {
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  const handleWatchDemoClick = () => {
    setIsVideoDialogOpen(true);
    umamiTrackEvent("watch_demo_button_clicked");
  };

  return (
    <>
      <span className="relative bottom-0 text-center text-sm text-gray-900 lg:bottom-3">
        <button
          onClick={handleWatchDemoClick}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-blue-600 hover:underline"
        >
          <span>How it works</span>
        </button>
        {" | "}
        <a
          href="https://dub.sh/easy-invoice-pdf-feedback"
          className="transition-colors hover:text-blue-600 hover:underline"
          target="_blank"
        >
          Share your feedback
        </a>
      </span>

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
            <video
              src={VIDEO_DEMO_URL}
              muted
              controls
              autoPlay
              playsInline
              className="h-full w-full object-cover"
              data-testid="how-it-works-video"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
