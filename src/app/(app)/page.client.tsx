"use client";

import { INITIAL_INVOICE_DATA } from "@/app/constants";
import {
  invoiceSchema,
  METADATA_LOCAL_STORAGE_KEY,
  PDF_DATA_LOCAL_STORAGE_KEY,
  SUPPORTED_TEMPLATES,
  type InvoiceData,
} from "@/app/schema";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDeviceContext } from "@/contexts/device-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAppMetadata } from "@/app/(app)/utils/get-app-metadata";
import { Footer } from "@/components/footer";
import { GitHubStarCTA } from "@/components/github-star-cta";
import { GITHUB_URL } from "@/config";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import {
  compressInvoiceData,
  decompressInvoiceData,
} from "@/utils/url-compression";
import * as Sentry from "@sentry/nextjs";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { InvoiceClientPage } from "./components";
import { showRandomCTAToast } from "./components/cta-toasts";
import { useCTAToast } from "./contexts/cta-toast-context";
import { useShowRandomCTAToastOnIdle } from "./hooks/use-show-random-cta-toast";
import { generateQrCodeDataUrl } from "./utils/generate-qr-code-data-url";
import { DEFAULT_METADATA } from "./utils/get-app-metadata";
import { handleInvoiceNumberBreakingChange } from "./utils/invoice-number-breaking-change";
import { InvoicePageHeader } from "@/app/(app)/components/invoice-page-header";
import { Button } from "@/components/ui/button";
// TODO: enable later when PRO version is released, this is PRO FEATURE =)
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
 * @returns The rendered invoice application page with form, preview, and controls
 */
export function AppPageClient({
  githubStarsCount,
}: {
  githubStarsCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { markCTAActionTriggered, incrementInteractionCount } = useCTAToast();

  const urlTemplateSearchParam = searchParams.get("template");

  // Validate template parameter with zod
  const templateValidation = z
    .enum(SUPPORTED_TEMPLATES)
    .default("default")
    .safeParse(urlTemplateSearchParam);

  const { isDesktop, isUADesktop } = useDeviceContext();
  const isMobile = !isDesktop;

  /**
   * State for storing the current invoice data.
   *
   * Initialized as null and populated from:
   * - localStorage on component mount
   * - URL query parameters when sharing invoice
   * - User input through the invoice form
   *
   * This state is persisted to localStorage on updates and used to generate the PDF preview.
   */
  const [invoiceDataState, setInvoiceDataState] = useState<InvoiceData | null>(
    null,
  );

  const [errorWhileGeneratingPdfIsShown, setErrorWhileGeneratingPdfIsShown] =
    useState(false);

  const [canShareInvoice, setCanShareInvoice] = useState(true);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  const [isInvoiceUrlCorrupted, setIsInvoiceUrlCorrupted] = useState(false);

  const [invoiceFormHasErrors, setInvoiceFormHasErrors] = useState(false);

  // Refs to track original URL invoice data
  const originalUrlInvoiceDataRef = useRef<InvoiceData | null>(null);

  // Generate QR code data URL when qrCodeData changes
  useEffect(() => {
    // Flag to detect if the component is still mounted and effect is active
    let active = true;

    /**
     * Generates a QR code image as a data URL when QR code data is available and visible.
     * If qrCodeData or its visibility flag is missing, resets the QR code image state.
     * Handles component unmount by checking `active`.
     */
    const generateQrCode = async () => {
      // If no QR code data or QR code display is not enabled, clear the QR code image
      if (!invoiceDataState?.qrCodeData || !invoiceDataState?.qrCodeIsVisible) {
        if (active) {
          setQrCodeDataUrl("");
        }
        return;
      }

      // Generate the QR code image as a data URL for the provided data string
      const dataUrl = await generateQrCodeDataUrl(invoiceDataState.qrCodeData);

      // Set the generated QR code image if the component is still mounted
      if (active) {
        setQrCodeDataUrl(dataUrl);
      }
    };

    // Call generateQrCode when invoiceDataState.qrCodeData or invoiceDataState.qrCodeIsVisible changes
    void generateQrCode();

    // Cleanup function to set active as false on component unmount,
    // preventing state updates on an unmounted component
    return () => {
      active = false;
    };
  }, [invoiceDataState?.qrCodeData, invoiceDataState?.qrCodeIsVisible]);

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
          id: "unable-to-load-saved-invoice-data-error-toast",
          duration: Infinity,
          closeButton: true,
          richColors: true,
        },
      );

      Sentry.captureException(error);
    }
  }, [templateValidation.data, templateValidation.success]);

  useEffect(() => {
    // Scroll to top of the page on first render for better UX
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
      console.log("[useEffect] [initialize invoice data from ** URL **]");

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

        // Override template from URL parameter if present for better UX
        // The ?template parameter provides a cleaner URL and better user experience
        // while ?data contains the actual invoice data including the template
        // ?template=" " has higher priority than ?data=" " =)
        if (templateValidation.success) {
          validatedDataFromURL.template = templateValidation.data;
        }

        setInvoiceDataState(validatedDataFromURL);

        // Store the original URL invoice data for change detection
        originalUrlInvoiceDataRef.current = validatedDataFromURL;

        const appMetadata = getAppMetadata();

        // add metadata with default values if missing for all users
        if (!appMetadata) {
          localStorage.setItem(
            METADATA_LOCAL_STORAGE_KEY,
            JSON.stringify(DEFAULT_METADATA),
          );
        }
      } catch (error) {
        console.error(
          "[useEffect] [initialize invoice data from ** URL **] Failed to parse URL data:",
          error,
        );
        // fallback to local storage in case of error
        loadFromLocalStorage();

        setIsInvoiceUrlCorrupted(true);

        toast.error("The shared invoice URL appears to be incorrect", {
          id: "invalid-invoice-url-error-toast", // prevent duplicate toasts
          description: (
            <div className="flex flex-col gap-2">
              <p className="">
                Please verify that you have copied the complete invoice URL. The
                link may be truncated or corrupted.
              </p>
              <p className="">Try generating a new link.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentTemplate =
                    searchParams.get("template") || "default";
                  router.replace(`/?template=${currentTemplate}`, {
                    scroll: false,
                  });

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
    } else {
      console.log(
        "[useEffect] [initialize invoice data from ** LOCAL STORAGE **]",
      );

      // if no data in url, load from local storage
      loadFromLocalStorage();
    }
  }, [loadFromLocalStorage, router, searchParams]);

  // IMPORTANT: 🔥🔥🔥 DOUBLE check if below useEffect works as expected 🔥🔥🔥
  /**
   * Ensures the template query parameter is present in the URL (for better user experience)
   * If missing, adds it based on the current invoice data state.
   */
  useEffect(() => {
    // Only run if we have invoice data and no template in URL
    if (!invoiceDataState || searchParams.get("template")) {
      return;
    }

    console.log("[useEffect] [add missing template to URL]", {
      template: invoiceDataState.template,
    });

    // Create a new URLSearchParams object from the current search parameters
    const currentParams = new URLSearchParams(searchParams.toString());

    // Add the template parameter from the invoice data
    currentParams.set("template", invoiceDataState.template);

    // Update the browser URL without triggering a page reload or scroll
    router.replace(`?${currentParams.toString()}`, { scroll: false });
  }, [invoiceDataState, searchParams, router]);

  /**
   * Checks if the invoice has changed from the original shared URL version.
   * Shows a toast notification once and cleans the URL when changes are detected.
   */
  const checkForInvoiceChanges = useCallback(
    (currentData: InvoiceData) => {
      console.log("[checkForInvoiceChanges]", currentData.template, {
        originalUrlInvoiceDataRef: originalUrlInvoiceDataRef.current,
      });

      // Check if URL has data i.e. if user has shared invoice link
      const urlData = searchParams.get("data");

      // Skip if no original URL data or no data in url
      if (!originalUrlInvoiceDataRef.current || !urlData) {
        console.log("[checkForInvoiceChanges] skipping");

        return;
      }

      // TODO: Improve this check, by using more reliable way to compare the invoice data (i.e. using npm lib)
      const invoiceHasChanged =
        JSON.stringify(originalUrlInvoiceDataRef.current) !==
        JSON.stringify(currentData);

      if (invoiceHasChanged) {
        console.log("[checkForInvoiceChanges] invoice has changed");

        toast.info(
          <div className="space-y-2">
            <p className="text-sm font-semibold">Invoice Updated</p>
            <p className="text-muted-foreground text-pretty leading-relaxed">
              Your changes have modified this invoice from its shared version.
            </p>

            <p className="text-muted-foreground text-pretty leading-relaxed">
              Click{" "}
              <span className="font-semibold text-foreground">
                &apos;Generate a link to invoice&apos;
              </span>{" "}
              to create an updated shareable link.
            </p>
          </div>,
          {
            id: "invoice-has-changed-toast",
            duration: 20_000,
            closeButton: true,
            position: isMobile ? "top-center" : "bottom-right",
          },
        );

        // Remove the ?data parameter from URL since the invoice has been modified (clean url, because it's no longer valid)
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.delete("data");

        // Update the browser URL without triggering a page reload or scroll
        // This keeps the URL in sync with the invoice state while maintaining user position
        router.replace(`?${currentParams.toString()}`, { scroll: false });
      }
    },
    [router, isMobile, searchParams],
  );

  const handleInvoiceDataChange = (updatedData: InvoiceData) => {
    console.log("[handleInvoiceDataChange]");

    if (isInvoiceUrlCorrupted) {
      console.log("[handleInvoiceDataChange] clearing url due to corruption");

      /** CLEAR URL IN CASE OF CORRUPTED INVOICE URL (i.e. "/?data=") for better UX and consistency */

      // Remove the ?data parameter from URL since the invoice has been modified (clean url, because it's no longer valid)
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.delete("data");

      // update the url
      router.replace(`?${currentParams.toString()}`, { scroll: false });

      // Show notification that URL was cleared due to corruption
      toast.info(
        <div className="space-y-2">
          <p className="text-sm font-semibold">Corrupted URL Cleared</p>
          <p className="text-muted-foreground text-pretty leading-relaxed">
            The invalid invoice URL has been removed from the address bar.
          </p>
          <p className="text-muted-foreground text-pretty leading-relaxed">
            Click{" "}
            <span className="font-semibold text-foreground">
              &apos;Generate a link to invoice&apos;
            </span>{" "}
            to create a new shareable link.
          </p>
        </div>,
        {
          id: "corrupted-url-cleared-toast",
          duration: 15_000,
          closeButton: true,
          position: isMobile ? "top-center" : "bottom-right",
        },
      );

      // Reset the invoice url corruption state
      setIsInvoiceUrlCorrupted(false);
    }

    setInvoiceDataState(updatedData);
    checkForInvoiceChanges(updatedData);

    // this is used to show CTA toast
    incrementInteractionCount();

    const currentTemplate = searchParams.get("template");

    // update the url with the new template
    if (currentTemplate !== updatedData.template) {
      console.log("[handleInvoiceDataChange] update url with new template", {
        currentTemplate,
        updatedDataTemplate: updatedData.template,
      });

      router.replace(`/?template=${updatedData.template}`, { scroll: false });
    } else {
      console.log("[handleInvoiceDataChange] invoice template did not change");
    }
  };

  /** Generate a shareable invoice link */
  const handleShareInvoice = async () => {
    if (!canShareInvoice) {
      toast.error("Unable to Share Invoice", {
        id: "unable-to-share-invoice-error-toast",
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

    // prevent sharing invoice if there are form errors
    if (invoiceFormHasErrors) {
      toast.error("Unable to Share Invoice", {
        id: "unable-to-share-invoice-form-errors-error-toast",
        duration: 6000,
        position: isMobile ? "top-center" : "bottom-right",
        description: (
          <p className="text-pretty text-xs leading-relaxed text-red-700">
            Please fix the errors in the invoice form to generate a shareable
            link.
          </p>
        ),
      });

      return;
    }

    // if invoice data state is valid, generate the shareable link and update the url
    if (invoiceDataState) {
      try {
        const newInvoiceDataValidated = invoiceSchema.parse(invoiceDataState);

        // Compress JSON keys before stringifying to reduce URL size
        const compressedKeys = compressInvoiceData(newInvoiceDataValidated);
        const compressedJson = JSON.stringify(compressedKeys);

        const compressedData = compressToEncodedURIComponent(compressedJson);

        /**
         * Check if the compressed data length exceeds browser URL limits.
         * With key compression, we can fit much larger invoices within this limit.
         */
        const URL_LENGTH_LIMIT = 4096;

        const estimatedUrlLength =
          window.location.origin.length + 7 + compressedData.length; // 7 for "/?data="

        if (estimatedUrlLength > URL_LENGTH_LIMIT) {
          toast.error("Invoice data is too large to share via URL", {
            id: "invoice-data-too-large-to-share-via-url-error-toast",
            description:
              "Download the invoice as PDF instead or remove some invoice items and try again.",
            duration: 10_000,
            position: isMobile ? "top-center" : "bottom-right",
          });

          return;
        }

        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.set("template", invoiceDataState.template);
        currentParams.set("data", compressedData);

        router.replace(`?${currentParams.toString()}`, { scroll: false });

        // Construct full URL with locale and compressed data
        const newGeneratedLinkFullUrl = `${window.location.origin}/?${currentParams.toString()}`;

        // Copy to clipboard
        if (!isUADesktop && navigator?.share) {
          // MOBILE + TABLET
          try {
            toast.success("Invoice link generated - Share invoice", {
              id: "invoice-link-generated-share-invoice-success-toast",
              description: (
                <p data-testid="share-invoice-link-description-toast">
                  Share this link to let others view and edit this invoice
                </p>
              ),
              position: isMobile ? "top-center" : "bottom-right",
              duration: 10_000,
            });

            await navigator
              ?.share({
                title: "Invoice link generated - Share invoice",
                url: newGeneratedLinkFullUrl,
              })
              .then(() => {
                umamiTrackEvent("share_invoice_link_mobile");
              })
              .catch((err) => {
                console.error(
                  "[handleShareInvoice] failed to share invoice:",
                  err,
                );

                // dismiss all other toasts
                toast.dismiss();

                toast.error("Failed to share invoice", {
                  id: "failed-to-share-invoice-error-toast",
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  description: `Please try again. Error: ${err?.message || "Unknown error"}`,
                  position: isMobile ? "top-center" : "bottom-right",
                  duration: 5_000,
                });
              });
          } catch (shareError) {
            console.error(
              "[handleShareInvoice] failed to share invoice:",
              shareError,
            );
            // Optionally fall back to clipboard on share cancel/error
            await navigator?.clipboard?.writeText(newGeneratedLinkFullUrl);
          }
        } else {
          // DESKTOP

          // on desktop, copy to clipboard
          await navigator?.clipboard
            ?.writeText(newGeneratedLinkFullUrl)
            .then(() => {
              toast.success("Invoice link copied to clipboard!", {
                id: "invoice-link-copied-to-clipboard-success-toast",
                description: (
                  <p data-testid="share-invoice-link-description-toast">
                    Share this link to let others view and edit this invoice
                  </p>
                ),
                position: isMobile ? "top-center" : "bottom-right",
                duration: 5_000,
              });

              umamiTrackEvent("share_invoice_link");
            })
            .catch((err) => {
              Sentry.captureException(err);
            });
        }

        // show CTA toast after x seconds (after invoice link notification is shown)
        setTimeout(() => {
          showRandomCTAToast();
        }, 5_000);

        markCTAActionTriggered();
      } catch (error) {
        console.error("Failed to share invoice:", error);
        toast.error("Failed to generate shareable link", {
          id: "failed-to-generate-shareable-link-error-toast",
        });

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
            qrCodeDataUrl={qrCodeDataUrl}
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
              qrCodeDataUrl={qrCodeDataUrl}
              setInvoiceFormHasErrors={setInvoiceFormHasErrors}
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
      <div className="fixed right-2 top-2 z-50 duration-500 animate-in fade-in slide-in-from-top-4">
        <GitHubStarCTA githubStarsCount={githubStarsCount} />
      </div>
    </TooltipProvider>
  );
}
