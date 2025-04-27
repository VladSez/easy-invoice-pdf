"use client";

import { InvoiceClientPage } from "@/app/components";
import { InvoicePDFDownloadLink } from "@/app/components/invoice-pdf-download-link";
import { INITIAL_INVOICE_DATA } from "@/app/constants";
import {
  invoiceSchema,
  PDF_DATA_LOCAL_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  type InvoiceData,
} from "@/app/schema";
import { TRANSLATIONS } from "@/app/schema/translations";
import { GithubIcon } from "@/components/etc/github-logo";
import { ProjectLogo } from "@/components/etc/project-logo";
import { SubscribeInput } from "@/components/subscribe-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomTooltip, TooltipProvider } from "@/components/ui/tooltip";
import { APP_URL } from "@/config";
import { useDeviceContext } from "@/contexts/device-context";
import { Link, useRouter } from "@/i18n/navigation";
import { isLocalStorageAvailable } from "@/lib/check-local-storage";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import * as Sentry from "@sentry/nextjs";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { Locale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
// import { InvoicePDFDownloadMultipleLanguages } from "./components/invoice-pdf-download-multiple-languages";

/**
 * This function handles the breaking change of the invoice number field.
 * It removes the old "invoiceNumber" field and adds the new "invoiceNumberObject" field with label and value.
 * @param json - The JSON object to handle the breaking change.
 * @returns The updated JSON object.
 */
function handleInvoiceNumberBreakingChange(json: unknown) {
  // check if the invoice number is in the json
  if (
    typeof json === "object" &&
    json !== null &&
    "invoiceNumber" in json &&
    typeof json.invoiceNumber === "string" &&
    "language" in json
  ) {
    umamiTrackEvent("breaking_change_detected");

    let lang: keyof typeof TRANSLATIONS;

    const invoiceLanguage = z
      .enum(SUPPORTED_LANGUAGES)
      .safeParse(json.language);

    if (!invoiceLanguage.success) {
      console.error("Invalid invoice language:", invoiceLanguage.error);

      // fallback to default language
      lang = SUPPORTED_LANGUAGES[0];
    } else {
      lang = invoiceLanguage.data;
    }

    const invoiceNumberLabel = TRANSLATIONS[lang].invoiceNumber;

    // Create new object without invoiceNumber and with invoiceNumberObject
    const newJson = {
      ...json,
      // assign invoiceNumber to invoiceNumberObject.value
      invoiceNumberObject: {
        label: `${invoiceNumberLabel}:`,
        value: json.invoiceNumber,
      },
    };

    // remove deprecated invoiceNumber from json
    delete (newJson as Record<string, unknown>).invoiceNumber;

    // update json
    json = newJson;

    return json;
  }

  return json;
}

export function AppPageClient({ params }: { params: { locale: Locale } }) {
  const { locale } = params;

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
        const parsedJSON: unknown = JSON.parse(decompressed);

        // this should happen before parsing the data with zod
        const updatedJson = handleInvoiceNumberBreakingChange(parsedJSON);

        const validated = invoiceSchema.parse(updatedJson);

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

        // this should happen before parsing the data with zod
        const updatedJson = handleInvoiceNumberBreakingChange(json);

        const parsedData = invoiceSchema.parse(updatedJson);

        setInvoiceDataState(parsedData);
      } else {
        // if no data in local storage, set initial data
        setInvoiceDataState(INITIAL_INVOICE_DATA);
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
        }
      );

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
              router.replace("/app");
            }
          } catch (error) {
            console.error("Failed to compare with URL data:", error);

            toast.error("The shared invoice URL appears to be incorrect", {
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
                      router.replace("/app");
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
    if (invoiceDataState) {
      try {
        const newInvoiceDataValidated = invoiceSchema.parse(invoiceDataState);
        const stringified = JSON.stringify(newInvoiceDataValidated);
        const compressed = compressToEncodedURIComponent(stringified);

        router.push(`/app?data=${compressed}`);

        // Construct full URL with locale and compressed data
        const newFullUrl = `${APP_URL}/${locale}/app?data=${compressed}`;

        // Copy to clipboard
        await navigator.clipboard.writeText(newFullUrl);

        // const newFullUrl = `${window.location.origin}/?data=${compressed}`;
        // await navigator.clipboard.writeText(newFullUrl);

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
      <div className="flex flex-col items-center justify-start bg-gray-100 pb-4 sm:p-4 md:justify-center lg:min-h-screen">
        <div className="w-full max-w-7xl bg-white p-3 shadow-lg sm:mb-0 sm:rounded-lg sm:p-6 2xl:max-w-[1680px]">
          <div data-testid="header">
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
                  asChild
                  className="mx-2 w-full bg-blue-500 text-white transition-all hover:scale-105 hover:bg-blue-600 hover:no-underline lg:mx-0 lg:w-auto"
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
      <Footer locale={locale} />
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
        <a
          href="https://github.com/VladSez/pdf-invoice-generator"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1"
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
        <button
          onClick={handleWatchDemoClick}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-blue-600 hover:underline"
        >
          <span>How it works</span>
        </button>
      </span>

      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[800px]">
          <DialogHeader className="p-6 pb-3">
            <DialogTitle>How EasyInvoicePDF Works</DialogTitle>
            <DialogDescription>
              Watch this quick demo to learn how to create and customize your
              invoices.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full overflow-hidden">
            <video
              src="https://ik.imagekit.io/fl2lbswwo/easy-invoice/easy-invoice-demo.mp4"
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

function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col gap-10 md:flex-row">
          <div className="space-y-4 md:w-1/3">
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
            <p className="text-sm text-slate-500">
              A free, open-source tool for creating professional PDF invoices
              with real-time preview.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://github.com/VladSez/pdf-invoice-generator"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-800"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link
                href="https://x.com/vlad_sazon"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-800"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:gap-10 md:flex-1 md:grid-cols-2">
            <div className="space-y-3"></div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-900">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    locale={locale}
                    className="text-sm text-slate-500 hover:text-slate-900"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com/VladSez/easy-invoice-pdf"
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
            </div>
          </div>
        </div>
        <div className="my-5 max-w-lg space-y-2">
          <p className="text-sm font-medium text-slate-900">
            Subscribe to our newsletter
          </p>
          <SubscribeInput
            translations={{
              title: "Subscribe to our newsletter",
              description:
                "Get the latest updates and news from EasyInvoicePDF.com",
              subscribe: "Subscribe",
              placeholder: "Enter your email",
              success: "Thank you for subscribing!",
              error: "Failed to subscribe. Please try again.",
              emailLanguageInfo: "All emails will be sent in English",
            }}
            locale={locale}
          />
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} EasyInvoicePDF.com
          </p>
          <p className="text-xs text-slate-500">
            Created by{" "}
            <Link
              href="https://github.com/VladSez"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-900"
            >
              Vlad Sazonau
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
