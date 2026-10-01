import Link from "next/link";

import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_INVOICE_PDF_LANGUAGES,
} from "@/app/schema";
import { FaqAccordion, FaqAccordionItem } from "@/components/ui/faq-accordion";
import { STRIPE_TEMPLATE_PATHNAME } from "@/utils/invoice-app-url";

/**
 * Plain, server-rendered copy below the invoice editor on `/`.
 *
 * The editor renders on the client, so before this the prerendered HTML held a loading
 * skeleton and the footer: under 300 words for the page that gets most of the site's
 * impressions. This says what the tool is in crawlable text, and links each landing page
 * with anchor text that names it, which a footer link list does less convincingly.
 *
 * Only on `/`: `/stripe-template` is indexed as its own page and has its own copy,
 * `StripeTemplateSeoContent`, written for the Stripe template's queries.
 */
export function HomeSeoContent() {
  return (
    <section
      className="w-full bg-gray-100 px-4 pb-12 pt-8 md:pb-16"
      aria-labelledby="home-seo-content-heading"
      data-testid="home-seo-content"
    >
      <div className="mx-auto max-w-3xl space-y-10 text-slate-800">
        <div>
          <h2
            id="home-seo-content-heading"
            className="text-balance text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl"
          >
            A free invoice generator that runs in your browser
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed">
            EasyInvoicePDF turns a short form into a PDF invoice. Type your
            details, your client&apos;s and the line items, and the preview
            redraws as you go. Download the PDF when it looks right. There is{" "}
            <Link
              href="/invoice-generator-no-login"
              className="font-medium text-slate-900 underline underline-offset-4"
            >
              no login and no signup
            </Link>
            , and the invoice is built on your own machine, so nothing you type
            is uploaded.
          </p>
          <p className="mt-4 text-pretty text-lg leading-relaxed">
            It is free, has no ads, and the{" "}
            <Link
              href="/open-source-invoice-generator"
              className="font-medium text-slate-900 underline underline-offset-4"
            >
              source code is open
            </Link>{" "}
            under AGPL-3.0, so you can read it or host your own copy.
          </p>
        </div>

        <div>
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            How to create an invoice
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-base">
            {HOW_TO_STEPS.map((step) => {
              return (
                <li key={step} className="text-pretty">
                  {step}
                </li>
              );
            })}
          </ol>
        </div>

        <div>
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            What goes on the invoice
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-base">
            <li className="text-pretty">
              Labels in{" "}
              <Link
                href="/multi-language-invoice-generator"
                className="font-medium text-slate-900 underline underline-offset-4"
              >
                {SUPPORTED_INVOICE_PDF_LANGUAGES.length} languages
              </Link>
              , including the total written out in words
            </li>
            <li className="text-pretty">
              {SUPPORTED_CURRENCIES.length} currencies, each with its own symbol
              and number format
            </li>
            <li className="text-pretty">
              {SUPPORTED_DATE_FORMATS.length} date formats, from 2026-03-20 to
              March 20, 2026
            </li>
            <li className="text-pretty">
              Your own tax label, such as VAT, GST or Sales Tax, or no tax
              columns at all
            </li>
            <li className="text-pretty">
              Your logo, bank details, and a QR code for a payment link
            </li>
            <li className="text-pretty">
              Two layouts: a classic one and a{" "}
              {/* a full page load, like the footer's link: the app keeps the template it
                  was opened on during client-side navigation */}
              <a
                href={STRIPE_TEMPLATE_PATHNAME}
                className="font-medium text-slate-900 underline underline-offset-4"
              >
                Stripe-style invoice template
              </a>
            </li>
          </ul>
          <p className="mt-4 text-pretty text-base leading-relaxed">
            Your details stay saved in your browser, so the next invoice starts
            filled in. To send it, download the PDF or share a link that opens
            the same invoice.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-balance text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            FAQ
          </h2>
          <FaqAccordion>
            {FAQ.map((item) => {
              return (
                <FaqAccordionItem key={item.question} question={item.question}>
                  {item.answer}
                </FaqAccordionItem>
              );
            })}
          </FaqAccordion>
        </div>

        <div>
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Invoices for every kind of work
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-base sm:grid-cols-2">
            {USE_CASE_LINKS.map(({ href, label }) => {
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-medium text-slate-900 underline underline-offset-4"
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

const HOW_TO_STEPS = [
  "Fill in your details as the seller, and your client's as the buyer",
  "Pick the invoice language, currency and date format",
  "Add a line for each product or service, with quantity and price",
  "Download the PDF, or copy a link to send your client",
] as const;

const USE_CASE_LINKS = [
  { href: "/freelance-invoice-template", label: "Freelance invoice template" },
  {
    href: "/contractor-invoice-template",
    label: "Contractor invoice template",
  },
  { href: "/proforma-invoice-generator", label: "Proforma invoice generator" },
  {
    href: "/export-invoice-format",
    label: "Export invoice format for services",
  },
  { href: "/invoice-template-pdf", label: "Invoice template PDF" },
  {
    href: "/stripe-invoice-alternative",
    label: "Stripe-style invoice without Stripe",
  },
  { href: "/swedish-invoice-generator", label: "Swedish invoice generator" },
  {
    href: "/norwegian-invoice-generator",
    label: "Norwegian invoice generator",
  },
] as const;

const FAQ = [
  {
    question: "Is EasyInvoicePDF really free?",
    answer:
      "Yes. There is no paid plan, no watermark and no limit on how many invoices you make.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. There is no signup and no email step. Open the page and start typing.",
  },
  {
    question: "Where is my invoice data stored?",
    answer:
      "In your own browser's storage. The PDF is generated on your device, so the invoice never reaches a server. Clearing your browser data removes it, so keep the PDFs you need.",
  },
  {
    question: "Can I add my logo?",
    answer:
      "Yes. Both templates accept a JPEG, PNG or WebP logo at the top of the invoice.",
  },
  {
    question: "Is this accounting software?",
    answer:
      "No. It makes invoice PDFs and does not track payments, file taxes or keep books. Check the invoice against the rules that apply to your business.",
  },
] as const;
