import Link from "next/link";

import { SUPPORTED_INVOICE_PDF_LANGUAGES } from "@/app/schema";
import { FaqAccordion, FaqAccordionItem } from "@/components/ui/faq-accordion";

/**
 * Plain, server-rendered copy below the invoice editor on `/stripe-template`.
 *
 * The route has its own canonical URL and title ("Stripe Invoice Template"), so it is
 * indexed as a page of its own, but the editor renders on the client: without this, its
 * prerendered HTML is a loading skeleton and the footer. `HomeSeoContent` solves the same
 * problem on `/`.
 *
 * Written for "Stripe invoice template": what the layout looks like and how to fill it
 * in. The general pitch (free, no login, open source) is `/`'s, and "Stripe invoice
 * generator" belongs to `/stripe-invoice-alternative`, so this links to both rather than
 * repeating them.
 */
export function StripeTemplateSeoContent() {
  return (
    <section
      className="w-full bg-gray-100 px-4 pb-12 pt-8 md:pb-16"
      aria-labelledby="stripe-template-seo-content-heading"
      data-testid="stripe-template-seo-content"
    >
      <div className="mx-auto max-w-3xl space-y-10 text-slate-800">
        <div>
          <h2
            id="stripe-template-seo-content-heading"
            className="text-balance text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl"
          >
            A free Stripe-style invoice template
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed">
            This template follows the layout of the invoices Stripe sends: the
            amount due and its due date first, a single line-item table, and a
            short summary of totals. Fill in the form, and the preview redraws
            as you type. Download the PDF when it looks right.
          </p>
          <p className="mt-4 text-pretty text-lg leading-relaxed">
            You don&apos;t need a Stripe account. It is a layout you fill in,
            not a payments service: no products to set up and no dashboard. The
            invoice is built in your browser, and{" "}
            <Link
              href="/invoice-generator-no-login"
              className="font-medium text-slate-900 underline underline-offset-4"
            >
              there is no signup
            </Link>
            .
          </p>
        </div>

        <div>
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            What&apos;s on the template
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-base">
            {TEMPLATE_PARTS.map((part) => {
              return (
                <li key={part} className="text-pretty">
                  {part}
                </li>
              );
            })}
            <li className="text-pretty">
              Labels in{" "}
              <Link
                href="/multi-language-invoice-generator"
                className="font-medium text-slate-900 underline underline-offset-4"
              >
                {SUPPORTED_INVOICE_PDF_LANGUAGES.length} languages
              </Link>
              , with your own tax label such as VAT, GST or Sales Tax
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            How to fill in the Stripe invoice template
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
          <p className="mt-4 text-pretty text-base leading-relaxed">
            Prefer a plainer A4 layout? Switch to the{" "}
            {/* a full page load with an explicit template: a bare `/` sends a visitor whose
                saved invoice uses this template straight back here */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/?template=default"
              className="font-medium text-slate-900 underline underline-offset-4"
            >
              classic invoice template
            </a>
            . Your details carry over.
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
          <p className="mt-6 text-pretty text-base leading-relaxed">
            Comparing it with billing through Stripe itself? See the{" "}
            <Link
              href="/stripe-invoice-alternative"
              className="font-medium text-slate-900 underline underline-offset-4"
            >
              Stripe invoice generator
            </Link>{" "}
            page.
          </p>
        </div>
      </div>
    </section>
  );
}

const TEMPLATE_PARTS = [
  "The amount due and the due date at the top, where your client looks first",
  "An optional Pay online link under the amount, pointing to any payment page you use",
  "A line-item table with quantity and unit price, then subtotal, tax and total",
  "Your logo beside the invoice title, and your details next to your client's",
  "A footer on every page with the invoice number, the amount due and page numbers",
  "An optional QR code with any text you choose, such as a payment link",
  "US Letter page size",
] as const;

const HOW_TO_STEPS = [
  "Add your details as the seller and your client's as the buyer",
  "Set the invoice number, issue date and due date",
  "Add a line for each product or service, with quantity and price",
  "Paste a payment link into Pay online if you want one on the invoice",
  "Download the PDF, or copy a link that opens the same invoice",
] as const;

const FAQ = [
  {
    question: "Do I need a Stripe account to use this template?",
    answer:
      "No. The template copies the look of a Stripe invoice, but nothing here connects to Stripe. You type the details and download a PDF.",
  },
  {
    question: "Can my client pay from the invoice?",
    answer:
      "Only through a link you add. Paste any payment URL, such as a Stripe Payment Link, PayPal or your bank's page, into Pay online and it becomes a clickable link in the PDF. You can put the same link in the QR code field too.",
  },
  {
    question: "Is the Stripe invoice template free?",
    answer:
      "Yes. There is no paid plan, no watermark and no limit on how many invoices you download.",
  },
  {
    question: "Can I add my logo?",
    answer:
      "Yes. Upload a JPEG, PNG or WebP and it appears at the top of the invoice.",
  },
] as const;
