"use client";

import { INITIAL_INVOICE_DATA } from "@/app/constants";
import {
  invoiceSchema,
  METADATA_LOCAL_STORAGE_KEY,
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

import { getAppMetadata } from "@/app/(app)/utils/get-app-metadata";
import { GithubIcon } from "@/components/etc/github-logo";
import { Footer } from "@/components/footer";
import { GitHubStarCTA } from "@/components/github-star-cta";
import { ProjectLogoDescription } from "@/components/project-logo-description";
import { GITHUB_URL, VIDEO_DEMO_URL } from "@/config";
import { isLocalStorageAvailable } from "@/lib/check-local-storage";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";
import {
  compressInvoiceData,
  decompressInvoiceData,
} from "@/utils/url-compression";
import * as Sentry from "@sentry/nextjs";
import { AlertCircleIcon, HeartIcon } from "lucide-react";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { InvoiceClientPage } from "./components";
import { CTA_TOAST_TIMEOUT, showRandomCTAToast } from "./components/cta-toasts";
import { InvoicePDFDownloadLink } from "./components/invoice-pdf-download-link";
import { useCTAToast } from "./contexts/cta-toast-context";
import {
  CTA_TOAST_LAST_SHOWN_STORAGE_KEY,
  useShowRandomCTAToastOnIdle,
} from "./hooks/use-show-random-cta-toast";
import { DEFAULT_METADATA } from "./utils/get-app-metadata";
import { handleInvoiceNumberBreakingChange } from "./utils/invoice-number-breaking-change";

// import { InvoicePDFDownloadMultipleLanguages } from "./components/invoice-pdf-download-multiple-languages";

/**
 * Main client component for the invoice application page.
 *
 * This component handles:
 * - Loading and persisting invoice data from/to localStorage
 * - URL-based invoice sharing via compressed data in query parameters
 * - Template selection and validation
 * - Invoice data state management and updates
 * - PDF generation and download functionality
 * - Share invoice functionality with URL generation
 * - CTA toast notifications for user engagement
 * - Error handling and user feedback
 *
 * @param props - Component props
 * @param props.githubStarsCount - The current number of GitHub stars for the project, used for display in CTAs
 *
 * @returns The rendered invoice application page with form, preview, and controls
 */
export function AppPageClient({
  githubStarsCount,
}: {
  githubStarsCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { markToastAsShown } = useCTAToast();

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

  useShowRandomCTAToastOnIdle();

  // Helper function to load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const appMetadata = getAppMetadata();

      // add metadata with default values if missing for all users
      if (!appMetadata) {
        localStorage.setItem(
          METADATA_LOCAL_STORAGE_KEY,
          JSON.stringify(DEFAULT_METADATA),
        );
      }

      const savedData = localStorage.getItem(PDF_DATA_LOCAL_STORAGE_KEY);

      if (savedData) {
        const json: unknown = JSON.parse(savedData);

        // we patch the invoice number breaking change here
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

      // fallback to initial data on error
      setInvoiceDataState(INITIAL_INVOICE_DATA);

      toast.error(
        "Unable to load your saved invoice data. For your convenience, we've reset the form to default values. Please try creating a new invoice.",
        {
          duration: Infinity,
          closeButton: true,
          richColors: true,
        },
      );

      Sentry.captureException(error);
    }
  }, [templateValidation.data, templateValidation.success]);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Initialize data from URL (via shared invoice link) or localStorage on page load
  useEffect(() => {
    const compressedInvoiceDataInUrl = searchParams.get("data");
    const urlTemplateSearchParam = searchParams.get("template");

    // Validate template parameter with zod
    const templateValidation = z
      .enum(SUPPORTED_TEMPLATES)
      .default("default")
      .safeParse(urlTemplateSearchParam);

    // first try to load from url i.e. if user has shared invoice link
    if (compressedInvoiceDataInUrl) {
      try {
        const decompressedData = decompressFromEncodedURIComponent(
          compressedInvoiceDataInUrl,
        );

        const parsedJSON: unknown = JSON.parse(decompressedData);

        // Restore original keys from compressed format, we store keys in compressed format to reduce URL size i.e. {name: "John Doe"} -> {n: "John Doe"}
        const decompressedKeys = decompressInvoiceData(
          parsedJSON as Record<string, unknown>,
        );

        // we patch the invoice number breaking change here (this should happen before parsing the data with zod)
        const updatedJson = handleInvoiceNumberBreakingChange(decompressedKeys);

        const validatedDataFromURL = invoiceSchema.parse(updatedJson);

        if (templateValidation.success) {
          validatedDataFromURL.template = templateValidation.data;
        }

        setInvoiceDataState(validatedDataFromURL);

        const appMetadata = getAppMetadata();

        // add metadata with default values if missing for all users
        if (!appMetadata) {
          localStorage.setItem(
            METADATA_LOCAL_STORAGE_KEY,
            JSON.stringify(DEFAULT_METADATA),
          );
        }
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
    if (!isLocalStorageAvailable) {
      Sentry.captureException(new Error("Local storage is not available"));

      return;
    }

    if (invoiceDataState) {
      try {
        const newInvoiceDataValidated = invoiceSchema.parse(invoiceDataState);

        // IMPORTANT
        // TODO: double check if we need this code, because we already save to local storage in the Invoice Form component (debouncedRegeneratePdfOnFormChange fn line:165)
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

        // we want to show a toast if the invoice has changed and shared invoice link needs to be regenerated
        if (urlData) {
          try {
            const decompressed = decompressFromEncodedURIComponent(urlData);

            const urlParsed: unknown = JSON.parse(decompressed);

            // Restore original keys from compressed format
            const decompressedInvoiceDataFromUrl = decompressInvoiceData(
              urlParsed as Record<string, unknown>,
            );

            const validatediInvoiceDataFromUrl = invoiceSchema.parse(
              decompressedInvoiceDataFromUrl,
            );

            const invoiceHasChanged =
              JSON.stringify(validatediInvoiceDataFromUrl) !==
              JSON.stringify(newInvoiceDataValidated);

            // if invoice has changed, show toast and clean url because the link to invoice is no longer valid and needs to be regenerated
            if (invoiceHasChanged) {
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
                    The link may be truncated or corrupted. Try refreshing the
                    page and generating a new link.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
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

        // if (isToastShownInSession) {
        //   umamiTrackEvent("cta_toast_skipped_shared_invoice_link");
        //   return;
        // }

        // Show a CTA toast
        setTimeout(() => {
          showRandomCTAToast();

          // Mark toast as shown in session to prevent duplicate toasts
          markToastAsShown();

          // Update timestamp to prevent other CTA toasts from showing
          localStorage.setItem(
            CTA_TOAST_LAST_SHOWN_STORAGE_KEY,
            String(Date.now()),
          );
        }, CTA_TOAST_TIMEOUT);
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
      <div className="flex flex-col items-center justify-start bg-gray-100 pb-4 sm:p-4 md:justify-center lg:min-h-screen">
        <div className="w-full max-w-7xl bg-white p-3 shadow-lg sm:mb-0 sm:rounded-lg sm:p-6 sm:pb-1 2xl:max-w-[1680px]">
          <InvoicePageHeader
            canShareInvoice={canShareInvoice}
            handleShareInvoice={handleShareInvoice}
            isDesktop={isDesktop}
            invoiceDataState={invoiceDataState}
            errorWhileGeneratingPdfIsShown={errorWhileGeneratingPdfIsShown}
            setErrorWhileGeneratingPdfIsShown={
              setErrorWhileGeneratingPdfIsShown
            }
          />
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
            "Create professional invoices in seconds with our free & open-source invoice maker. 100% in-browser, no sign-up required. Includes live PDF preview and a Stripe-style template - perfect for freelancers, startups, and small businesses.",
          footerCreatedBy: "Made by",
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
      <GitHubStarCTA githubStarsCount={githubStarsCount} />
    </TooltipProvider>
  );
}

/**
 * Header component for the invoice page.
 * 
 * Displays the project logo, description, and action buttons including:
 * - Share invoice button (with conditional rendering based on shareability)
 * - Download PDF button with error handling
 * - Support project button

 * @returns The rendered invoice page header with logo, description, and action buttons
 */

function InvoicePageHeader({
  canShareInvoice,
  handleShareInvoice,
  isDesktop,
  invoiceDataState,
  errorWhileGeneratingPdfIsShown,
  setErrorWhileGeneratingPdfIsShown,
}: {
  canShareInvoice: boolean;
  handleShareInvoice: () => void;
  isDesktop: boolean;
  invoiceDataState: InvoiceData;
  errorWhileGeneratingPdfIsShown: boolean;
  setErrorWhileGeneratingPdfIsShown: (value: boolean) => void;
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
        <div className="mb-1 flex w-full flex-wrap justify-center gap-3 lg:flex-nowrap lg:justify-end">
          {/* Support project button (hidden on mobile) */}
          <Button
            asChild
            variant="outline"
            className="group mx-2 hidden w-full border-pink-200 bg-pink-50 text-pink-700 shadow-md transition-all duration-200 hover:border-pink-300 hover:bg-pink-100 hover:text-pink-800 hover:no-underline hover:shadow-lg focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 lg:mx-0 lg:inline-flex lg:w-auto"
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
      <div className="mb-3 flex flex-row items-center justify-center lg:mb-0 lg:mt-4 lg:justify-start xl:mt-1">
        <ProjectInfo />
      </div>
    </div>
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
      <div className="relative bottom-0 flex flex-wrap items-center justify-center gap-1 text-center text-sm text-gray-900 lg:bottom-3">
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
        {" | "}

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1 transition-colors hover:text-blue-600 hover:underline"
        >
          <GithubIcon className="size-4 transition-transform group-hover:fill-blue-600" />
          <span className="group-hover:text-blue-600">View on GitHub</span>
        </a>
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
